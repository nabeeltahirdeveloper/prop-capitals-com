import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ChallengesModule } from './challenges/challenges.module';
import { TradingAccountsModule } from './trading-accounts/trading-accounts.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { TradesModule } from './trades/trades.module';
import { PendingOrdersModule } from './pending-orders/pending-orders.module';
import { PricesModule } from './prices/prices.module';
import { MarketDataModule } from './market-data/market-data.module';
import { PaymentsModule } from './payments/payments.module';
import { BrokerServersModule } from './broker-servers/broker-servers.module';
import { PayoutsModule } from './payouts/payouts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SupportTicketsModule } from './support-tickets/support-tickets.module';
import { AdminPayoutsModule } from './admin/payouts/admin-payouts.module';
import { AdminPaymentsModule } from './admin/payments/admin-payments.module';
import { AdminUsersModule } from './admin/users/admin-users.module';
import { AdminAccountsModule } from './admin/accounts/admin-accounts.module';
import { AdminChallengesModule } from './admin/challenges/admin-challenges.module';
import { AdminTradesModule } from './admin/trades/admin-trades.module';
import { AdminRiskModule } from './admin/risk/admin-risk.module';
import { AdminScalingModule } from './admin/scaling/admin-scaling.module';
import { AdminCouponsModule } from './admin/coupons/admin-coupons.module';
import { AdminSettingsModule } from './admin/settings/admin-settings.module';
import { AdminDashboardModule } from './admin/dashboard/admin-dashboard.module';
import { AdminSupportModule } from './admin/support/admin-support.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({

  imports: [

    ConfigModule.forRoot({

      isGlobal: true,

    }),

    ScheduleModule.forRoot(),

    PrismaModule,

    UsersModule,

    AuthModule,

    ChallengesModule,

    TradingAccountsModule,

    EvaluationModule,

    TradesModule,

    PendingOrdersModule,

    PricesModule,

    MarketDataModule,

    PaymentsModule,

    BrokerServersModule,

    PayoutsModule,

    NotificationsModule,

    SupportTicketsModule,

    AdminPayoutsModule,

    AdminPaymentsModule,

    AdminUsersModule,

    AdminAccountsModule,

    AdminChallengesModule,

    AdminTradesModule,

    AdminRiskModule,

    AdminScalingModule,

    AdminCouponsModule,

    AdminSettingsModule,

    AdminDashboardModule,

    AdminSupportModule,

    WebsocketModule

  ],

})

export class AppModule {}
