// import { Module } from '@nestjs/common';
// import { PaymentsService } from './payments.service';
// import { PaymentsController } from './payments.controller';
// import { PrismaModule } from '../prisma/prisma.module';
// import { NotificationsModule } from '../notifications/notifications.module';
// import { EmailModule } from 'src/email/email.module';
// import { CouponsModule } from '../coupons/coupons.module';

// @Module({
//   imports: [PrismaModule, NotificationsModule, EmailModule, CouponsModule],
//   providers: [PaymentsService],
//   controllers: [PaymentsController]
// })
// export class PaymentsModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';
import { EmailService } from '../email/email.service';
import { XoalaWebhookService } from './webhook.service';
import { XoalaAuthService } from './xoala-auth.service';
import { WorldCardService, WorldCardWebhookService } from './worldcard.service';
import { PaymentProviderRouter } from './provider-router.service';
import { PaytechService, PaytechWebhookService } from './paytech.service';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaytechService,
    PaytechWebhookService,
    XoalaWebhookService,
    XoalaAuthService,
    WorldCardService,
    WorldCardWebhookService,
    PaymentProviderRouter,
    PrismaService,
    NotificationsService,
    CouponsService,
    EmailService,
  ],
  exports: [
    PaymentsService,
    XoalaWebhookService,
    XoalaAuthService,
    WorldCardService,
    WorldCardWebhookService,
    PaymentProviderRouter,
  ],
})
export class PaymentsModule {}
