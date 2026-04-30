import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { OrdersModule } from "./orders/orders.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReleasesModule } from "./releases/releases.module";
import { TradesModule } from "./trades/trades.module";
import { UsersModule } from "./users/users.module";
import { WalletsModule } from "./wallets/wallets.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        DIRECT_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        PORT: Joi.number().port().default(4000),
      }),
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ReleasesModule,
    WalletsModule,
    OrdersModule,
    TradesModule,
  ],
})
export class AppModule {}
