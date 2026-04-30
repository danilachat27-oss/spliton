import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ReleasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.release.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}
