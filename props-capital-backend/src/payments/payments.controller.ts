import { All, Body, Controller, Get, HttpCode, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { XoalaWebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly xoalaWebhookService: XoalaWebhookService,
        private readonly configService: ConfigService,
    ) { }

    // Existing internal purchase (no payment gateway)
    @Post('purchase')
    async purchase(@Body() body: any) {
        console.log('PURCHASE BODY:', body);
        return this.paymentsService.purchaseChallenge(body);
    }

    // Xoala: Server-to-Server card charge (collects card details server-side).
    // Guarded by JWT — the cardholder MUST be logged in. The trusted email
    // comes from the JWT so users can't pay against someone else's account
    // (or a typo) by changing the body's email field.
    @Post('xoala/charge')
    @UseGuards(JwtAuthGuard)
    async xoalaCharge(@Body() body: any, @Req() req: Request) {
        const authUser = (req as any).user as { userId: string; email: string };
        return this.paymentsService.createXoalaCharge({
            ...body,
            email: authUser.email,
            authUserId: authUser.userId,
        });
    }

    // Xoala: Standard Checkout notification/callback
    @Post('xoala/callback')
    @HttpCode(200)
    async xoalaCallback(@Body() body: any) {
        return this.xoalaWebhookService.handleCallback(body);
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
