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

    // WorldCard: create hosted checkout session
    @Post('worldcard/session')
    async worldCardSession(@Body() body: any) {
        return this.paymentsService.createWorldCardSession(body);
    }

    // WorldCard: create hosted checkout session for guest (public payment link)
    @Post('worldcard/guest-session')
    async worldCardGuestSession(@Body() body: any) {
        return this.paymentsService.createGuestWorldCardSession(body);
    }

    // WorldCard: callback from payment gateway
    @Post('worldcard/callback')
    @HttpCode(200)
    async worldCardCallback(@Body() body: any) {
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
