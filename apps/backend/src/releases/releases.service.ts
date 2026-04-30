import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReleasesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.release.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}
