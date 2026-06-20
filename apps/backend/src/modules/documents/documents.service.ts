import {
  GeneratedDocumentKind,
  GeneratedDocumentStatus,
  Prisma,
  ReportFormat,
  TradeSettlementStatus,
} from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportRendererService } from '../../common/export/report-renderer.service';
import { formatToExt } from '../../common/export/report-format.util';
import { UserWalletService } from '../wallets/user-wallet.service';

const DOCUMENT_TTL_DAYS = 7;

function maskAddress(value: string): string {
  if (value.length <= 10) return '***';
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function maskUserRef(userId: string, email?: string | null): string {
  if (email && email.includes('@')) {
    const [local, domain] = email.split('@');
    const safeLocal = local.length <= 2 ? `${local[0] ?? ''}*` : `${local.slice(0, 2)}***`;
    return `${safeLocal}@${domain}`;
  }
  return `USR-${userId.slice(0, 8).toUpperCase()}`;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renderer: ReportRendererService,
    private readonly wallet: UserWalletService,
  ) {}

  async list(userId: string, page = 1, pageSize = 20) {
    const take = Math.min(50, Math.max(1, pageSize));
    const skip = (Math.max(1, page) - 1) * take;
    const [total, items] = await Promise.all([
      this.prisma.generatedDocument.count({ where: { ownerUserId: userId } }),
      this.prisma.generatedDocument.findMany({
        where: { ownerUserId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return {
      items: items.map((d) => this.mapDoc(d)),
      total,
      page,
      pageSize: take,
    };
  }

  async getById(userId: string, id: string) {
    const doc = await this.findOwned(userId, id);
    return this.mapDoc(doc);
  }

  async download(userId: string, id: string) {
    const doc = await this.findOwned(userId, id);
    if (doc.status === GeneratedDocumentStatus.EXPIRED) {
      throw new Error('DOCUMENT_EXPIRED');
    }
    if (doc.status !== GeneratedDocumentStatus.COMPLETED) {
      throw new Error('DOCUMENT_NOT_READY');
    }
    if (doc.expiresAt && doc.expiresAt.getTime() <= Date.now()) {
      await this.prisma.generatedDocument.update({
        where: { id },
        data: { status: GeneratedDocumentStatus.EXPIRED },
      });
      throw new Error('DOCUMENT_EXPIRED');
    }

    let buffer: Buffer;
    if (doc.fileContentBase64) {
      buffer = Buffer.from(doc.fileContentBase64, 'base64');
    } else {
      throw new Error('DOCUMENT_FILE_MISSING');
    }

    await this.prisma.generatedDocument.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 },
        lastDownloadedAt: new Date(),
      },
    });

    const ext = formatToExt(doc.format);
    return {
      id: doc.id,
      kind: doc.kind,
      format: doc.format.toLowerCase(),
      filename: `${doc.kind.toLowerCase()}-${doc.id.slice(0, 8)}.${ext}`,
      mimeType: doc.mimeType ?? 'application/pdf',
      contentBase64: buffer.toString('base64'),
      checksum: doc.fileChecksum,
    };
  }

  async generateDepositReceipt(userId: string, depositId: string) {
    const deposit = await this.prisma.deposit.findFirst({
      where: { id: depositId, walletTx: { wallet: { userId } } },
      include: {
        walletTx: { include: { wallet: true } },
      },
    });
    if (!deposit) {
      throw new Error('DEPOSIT_NOT_FOUND');
    }

    const rendered = await this.renderer.renderReceiptPdf({
      title: 'Квитанция пополнения',
      reference: deposit.id,
      status: deposit.status,
      generatedAt: new Date().toISOString(),
      fields: [
        {
          label: 'Amount',
          value: `${deposit.walletTx.netAmount.toString()} USDT`,
        },
        { label: 'Network', value: deposit.walletTx.wallet.network },
        { label: 'Tx hash', value: deposit.blockchainTxid ?? '—' },
        {
          label: 'Credited at',
          value: deposit.creditedAt?.toISOString() ?? '—',
        },
        {
          label: 'Wallet address',
          value: maskAddress(deposit.walletTx.wallet.address ?? ''),
        },
      ],
    });

    return this.saveDocument({
      userId,
      kind: GeneratedDocumentKind.DEPOSIT_RECEIPT,
      format: ReportFormat.PDF,
      entityType: 'deposit',
      entityId: deposit.id,
      rendered,
    });
  }

  async generateTradeReceipt(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: {
        id: tradeId,
        OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
        settlementStatus: TradeSettlementStatus.SETTLED,
      },
      include: {
        release: true,
        buyer: { select: { id: true, email: true } },
        seller: { select: { id: true, email: true } },
        buyOrder: { select: { id: true } },
      },
    });
    if (!trade) {
      throw new Error('TRADE_NOT_FOUND');
    }

    const isBuyer = trade.buyerUserId === userId;
    const side = isBuyer ? 'BUY' : 'SELL';
    const net = isBuyer
      ? trade.grossAmount
      : trade.grossAmount.minus(trade.feeTotal);

    const rendered = await this.renderer.renderReceiptPdf({
      title: 'Spliton trade receipt',
      reference: trade.id,
      status: trade.settlementStatus,
      generatedAt: new Date().toISOString(),
      fields: [
        { label: 'Trade ID', value: trade.id },
        { label: 'Side', value: side },
        { label: 'Release', value: trade.release.title },
        { label: 'Symbol', value: trade.release.symbol },
        { label: 'Units', value: trade.units.toString() },
        { label: 'Price per unit', value: `${trade.price.toString()} USDT` },
        { label: 'Gross amount', value: `${trade.grossAmount.toString()} USDT` },
        { label: 'Platform fee', value: `${trade.feeTotal.toString()} USDT` },
        { label: isBuyer ? 'Total debited' : 'Net credited', value: `${net.toString()} USDT` },
        {
          label: 'Buyer reference',
          value: maskUserRef(trade.buyer.id, trade.buyer.email),
        },
        {
          label: 'Seller reference',
          value: maskUserRef(trade.seller.id, trade.seller.email),
        },
        { label: 'Executed at', value: trade.executedAt.toISOString() },
        { label: 'Order reference', value: trade.buyOrder.id.slice(0, 8) },
        {
          label: 'Disclaimer',
          value:
            'This receipt confirms a settled secondary market trade on Spliton. Not a tax document.',
        },
      ],
    });

    return this.saveDocument({
      userId,
      kind: GeneratedDocumentKind.TRADE_RECEIPT,
      format: ReportFormat.PDF,
      entityType: 'trade',
      entityId: trade.id,
      rendered,
    });
  }

  async getTradeReceiptDocument(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: {
        id: tradeId,
        OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
      },
      select: { id: true },
    });
    if (!trade) {
      throw new Error('TRADE_NOT_FOUND');
    }

    const doc = await this.prisma.generatedDocument.findFirst({
      where: {
        ownerUserId: userId,
        kind: GeneratedDocumentKind.TRADE_RECEIPT,
        entityType: 'trade',
        entityId: tradeId,
        status: GeneratedDocumentStatus.COMPLETED,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!doc) {
      throw new Error('TRADE_RECEIPT_NOT_FOUND');
    }
    return this.mapDoc(doc);
  }

  async generatePrimaryOrderReceipt(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        primaryRaiseRoundId: { not: null },
        status: { in: ['SETTLED', 'PAID', 'FILLED'] },
      },
      include: {
        release: {
          include: { releaseArtists: { include: { artist: true }, take: 1 } },
        },
        user: { select: { id: true, email: true } },
      },
    });
    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    const artist =
      order.release.releaseArtists[0]?.artist.name ??
      order.release.copyrightOwner ??
      'Unknown Artist';
    const gross = order.grossAmount ?? new Prisma.Decimal(0);
    const fee = order.feeAmount ?? new Prisma.Decimal(0);

    const rendered = await this.renderer.renderReceiptPdf({
      title: 'Spliton primary purchase receipt',
      reference: order.id,
      status: order.status,
      generatedAt: new Date().toISOString(),
      fields: [
        { label: 'Order ID', value: order.id },
        { label: 'Release', value: order.release.title },
        { label: 'Artist', value: artist },
        { label: 'Symbol', value: order.release.symbol },
        { label: 'Units purchased', value: order.unitsTotal.toString() },
        {
          label: 'Unit price',
          value: `${order.unitPrice?.toString() ?? '0'} USDT`,
        },
        { label: 'Gross amount', value: `${gross.toString()} USDT` },
        { label: 'Platform fee', value: `${fee.toString()} USDT` },
        { label: 'Total paid', value: `${gross.toString()} USDT` },
        {
          label: 'Buyer reference',
          value: maskUserRef(order.user.id, order.user.email),
        },
        { label: 'Purchased at', value: order.createdAt.toISOString() },
        { label: 'Status', value: order.status },
        {
          label: 'Disclaimer',
          value:
            'This receipt confirms a primary market UNT purchase on Spliton. Not a tax document.',
        },
      ],
    });

    return this.saveDocument({
      userId,
      kind: GeneratedDocumentKind.PRIMARY_ORDER_RECEIPT,
      format: ReportFormat.PDF,
      entityType: 'primary_order',
      entityId: order.id,
      rendered,
    });
  }

  async getPrimaryOrderReceiptDocument(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId, primaryRaiseRoundId: { not: null } },
      select: { id: true },
    });
    if (!order) throw new Error('ORDER_NOT_FOUND');

    const doc = await this.prisma.generatedDocument.findFirst({
      where: {
        ownerUserId: userId,
        kind: GeneratedDocumentKind.PRIMARY_ORDER_RECEIPT,
        entityType: 'primary_order',
        entityId: orderId,
        status: GeneratedDocumentStatus.COMPLETED,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!doc) throw new Error('ORDER_RECEIPT_NOT_FOUND');
    return this.mapDoc(doc);
  }

  async generateWalletStatement(
    userId: string,
    params: { dateFrom?: string; dateTo?: string; format?: string },
  ) {
    const format =
      params.format?.toUpperCase() === 'XLSX'
        ? ReportFormat.XLSX
        : ReportFormat.PDF;
    const page = 1;
    const pageSize = 5000;
    const txs = await this.wallet.listTransactions(userId, page, pageSize);
    const headers = [
      'date',
      'type',
      'direction',
      'amount',
      'fee',
      'net',
      'status',
    ];
    const rows = txs.items.map((t) => [
      t.createdAt,
      t.type,
      t.direction,
      t.amount,
      t.fee,
      t.netAmount,
      t.status,
    ]);

    let rendered;
    if (format === ReportFormat.XLSX) {
      rendered = await this.renderer.render(
        {
          title: 'Wallet statement',
          reportType: 'wallet_statement',
          generatedAt: new Date().toISOString(),
          periodFrom: params.dateFrom,
          periodTo: params.dateTo,
          headers,
          rows,
          dataSheetName: 'Transactions',
        },
        ReportFormat.XLSX,
      );
    } else {
      rendered = await this.renderer.renderReceiptPdf({
        title: 'Wallet statement',
        reference: `wallet-${userId.slice(0, 8)}`,
        status: 'COMPLETED',
        generatedAt: new Date().toISOString(),
        fields: [
          { label: 'Transactions', value: String(rows.length) },
          { label: 'Period from', value: params.dateFrom ?? '—' },
          { label: 'Period to', value: params.dateTo ?? '—' },
        ],
      });
    }

    return this.saveDocument({
      userId,
      kind: GeneratedDocumentKind.WALLET_STATEMENT,
      format,
      entityType: 'wallet',
      entityId: userId,
      rendered,
      filtersJson: params,
    });
  }

  private async saveDocument(params: {
    userId: string;
    kind: GeneratedDocumentKind;
    format: ReportFormat;
    entityType: string;
    entityId: string;
    rendered: {
      buffer: Buffer;
      mimeType: string;
      rowCount: number;
      checksum: string;
    };
    filtersJson?: Record<string, unknown>;
  }) {
    const expiresAt = new Date(
      Date.now() + DOCUMENT_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    const doc = await this.prisma.generatedDocument.create({
      data: {
        kind: params.kind,
        format: params.format,
        status: GeneratedDocumentStatus.COMPLETED,
        ownerUserId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        fileContentBase64: params.rendered.buffer.toString('base64'),
        mimeType: params.rendered.mimeType,
        fileSizeBytes: params.rendered.buffer.length,
        fileChecksum: params.rendered.checksum,
        rowCount: params.rendered.rowCount,
        filtersJson: params.filtersJson as Prisma.InputJsonValue | undefined,
        expiresAt,
        completedAt: new Date(),
      },
    });
    return this.mapDoc(doc);
  }

  private async findOwned(userId: string, id: string) {
    const doc = await this.prisma.generatedDocument.findFirst({
      where: { id, ownerUserId: userId },
    });
    if (!doc) throw new Error('DOCUMENT_NOT_FOUND');
    return doc;
  }

  private mapDoc(doc: {
    id: string;
    kind: GeneratedDocumentKind;
    format: ReportFormat;
    status: GeneratedDocumentStatus;
    fileSizeBytes: number | null;
    expiresAt: Date | null;
    createdAt: Date;
    completedAt: Date | null;
    downloadCount: number;
  }) {
    return {
      id: doc.id,
      kind: doc.kind,
      format: doc.format.toLowerCase(),
      status: doc.status.toLowerCase(),
      fileSizeBytes: doc.fileSizeBytes,
      expiresAt: doc.expiresAt?.toISOString() ?? null,
      createdAt: doc.createdAt.toISOString(),
      completedAt: doc.completedAt?.toISOString() ?? null,
      downloadCount: doc.downloadCount,
    };
  }
}
