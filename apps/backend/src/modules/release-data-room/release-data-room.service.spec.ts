import { ReleaseDataRoomService } from './release-data-room.service';

describe('ReleaseDataRoomService', () => {
  const prisma = {
    release: { findFirst: jest.fn() },
    userPosition: { findFirst: jest.fn() },
    releaseDocument: { findMany: jest.fn() },
  };
  const service = new ReleaseDataRoomService(prisma as never);

  it('hides holder-only docs for guests', async () => {
    prisma.release.findFirst.mockResolvedValue({ id: 'r1', status: 'ACTIVE' });
    prisma.releaseDocument.findMany.mockResolvedValue([
      {
        id: 'd1',
        docType: 'risk',
        title: 'Risk',
        locale: 'ru',
        visibility: 'HOLDERS_ONLY',
        version: 1,
        url: 'https://example.com/risk.pdf',
      },
    ]);
    const res = await service.listPublic('r1', null);
    expect(res.items).toHaveLength(0);
  });
});
