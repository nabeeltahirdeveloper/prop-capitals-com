import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { WorldCardWebhookService } from './webhook.service';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly worldCardWebhookService: WorldCardWebhookService,
    ) { }

    // Existing internal purchase (no payment gateway)
    @Post('purchase')
    async purchase(@Body() body: any) {
        console.log('PURCHASE BODY:', body);
        return this.paymentsService.purchaseChallenge(body);
    }

    // Xoala: create hosted checkout session
    @Post('xoala/session')
    async xoalaSession(@Body() body: any) {
        return this.paymentsService.createXoalaCheckoutSession(body);
    }

    // Xoala: Standard Checkout notification/callback
    @Post('xoala/callback')
    @HttpCode(200)
    async xoalaCallback(@Body() body: any) {
        return this.worldCardWebhookService.handleCallback(body);
    }


    // Payment status polling (for frontend)
    @Get('status/:reference')
    async paymentStatus(@Param('reference') reference: string) {
        return this.paymentsService.getPaymentStatus(reference);
    }

    // User transactions list (for dashboard)
    @Get('user/:userId')
    async userPayments(@Param('userId') userId: string) {
        return this.paymentsService.getUserPayments(userId);
    }
}
