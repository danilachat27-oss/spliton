import { PriceBucket, Prisma } from '@prisma/client';

function bucketStartUtc(date: Date, bucket: PriceBucket): Date {
  const d = new Date(date);
  if (bucket === PriceBucket.D1) {
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  if (bucket === PriceBucket.H1) {
    d.setUTCMinutes(0, 0, 0);
    d.setUTCSeconds(0, 0);
    d.setUTCMilliseconds(0);
    return d;
  }
  return d;
}

async function upsertBucketPoint(
  tx: Prisma.TransactionClient,
  bucket: PriceBucket,
  params: {
    releaseId: string;
    executedAt: Date;
    price: Prisma.Decimal;
    units: Prisma.Decimal;
    gross: Prisma.Decimal;
  },
) {
  const ts = bucketStartUtc(params.executedAt, bucket);
  const existing = await tx.priceHistory.findUnique({
    where: {
      releaseId_bucket_ts: {
        releaseId: params.releaseId,
        bucket,
        ts,
      },
    },
  });

  if (existing) {
    await tx.priceHistory.update({
      where: { id: existing.id },
      data: {
        highPrice: params.price.greaterThan(existing.highPrice)
          ? params.price
          : existing.highPrice,
        lowPrice: params.price.lessThan(existing.lowPrice)
          ? params.price
          : existing.lowPrice,
        closePrice: params.price,
        volumeUnits: existing.volumeUnits.plus(params.units),
        volumeNotional: existing.volumeNotional.plus(params.gross),
      },
    });
    return;
  }

  await tx.priceHistory.create({
    data: {
      releaseId: params.releaseId,
      bucket,
      ts,
      openPrice: params.price,
      highPrice: params.price,
      lowPrice: params.price,
      closePrice: params.price,
      volumeUnits: params.units,
      volumeNotional: params.gross,
    },
  });
}

export async function recordTradePriceHistory(
  tx: Prisma.TransactionClient,
  params: {
    releaseId: string;
    executedAt: Date;
    price: Prisma.Decimal;
    units: Prisma.Decimal;
    gross: Prisma.Decimal;
  },
) {
  await upsertBucketPoint(tx, PriceBucket.D1, params);
  await upsertBucketPoint(tx, PriceBucket.H1, params);
}
