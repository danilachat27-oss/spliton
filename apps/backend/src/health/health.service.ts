import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return {
      status: "ok",
      service: "spliton-backend",
    };
  }

  async getDbHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      database: "connected",
    };
  }
}
