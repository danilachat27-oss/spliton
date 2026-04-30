import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import appConfig from "./config/app.config";
import { envValidationSchema } from "./config/env.validation";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { ReleasesModule } from "./modules/releases/releases.module";
import { TradesModule } from "./modules/trades/trades.module";
import { UsersModule } from "./modules/users/users.module";
import { WalletsModule } from "./modules/wallets/wallets.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
      load: [appConfig],
      validationSchema: envValidationSchema,
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
