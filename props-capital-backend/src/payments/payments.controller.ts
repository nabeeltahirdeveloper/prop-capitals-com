import { All, Body, Controller, Get, HttpCode, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { WorldCardWebhookService } from './webhook.service';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly worldCardWebhookService: WorldCardWebhookService,
        private readonly configService: ConfigService,
    ) { }

    // Existing internal purchase (no payment gateway)
    @Post('purchase')
    async purchase(@Body() body: any) {
        console.log('PURCHASE BODY:', body);
        return this.paymentsService.purchaseChallenge(body);
    }

    // Xoala: Server-to-Server card charge (collects card details server-side)
    @Post('xoala/charge')
    async xoalaCharge(@Body() body: any) {
        return this.paymentsService.createXoalaCharge(body);
    }

    // Xoala: Standard Checkout notification/callback
    @Post('xoala/callback')
    @HttpCode(200)
    async xoalaCallback(@Body() body: any) {
        return this.worldCardWebhookService.handleCallback(body);
    }

    // Xoala: cardholder-return after 3DS. Xoala submits a form POST here
    // when the customer finishes the ACS challenge. Vite (dev) and SPA hosts
    // (prod) don't serve HTML on POST routes, so we accept POST/GET on the
    // backend and 302-redirect the browser to the frontend success page,
    // forwarding the reference so the SPA can poll status from the webhook.
    @All('xoala/return')
    async xoalaReturn(
        @Query() query: any,
        @Body() body: any,
        @Res() res: Response,
    ) {
        const reference =
            query?.reference ||
            body?.merchantTransactionId ||
            body?.reference ||
            '';
        const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL') || '';
        const target = `${frontendUrl}/pay/success?reference=${encodeURIComponent(reference)}`;
        return res.redirect(302, target);
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
