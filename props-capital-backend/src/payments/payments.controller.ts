import { All, Body, Controller, Get, HttpCode, Logger, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { XoalaWebhookService } from './webhook.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

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
    // JWT is optional: logged-in users keep the normal locked-account flow,
    // while direct checkout guests can pay and have an account created from
    // their billing details.
    @Post('xoala/charge')
    @UseGuards(OptionalJwtAuthGuard)
    async xoalaCharge(@Body() body: any, @Req() req: Request) {
        const authUser = (req as any).user as { userId: string; email: string } | null;
        return this.paymentsService.createXoalaCharge({
            ...body,
            authUserId: authUser?.userId,
            ...(authUser
                ? {
                    email: authUser.email,
                }
                : {}),
        });
    }

    // Xoala: Standard Checkout notification/callback
    @Post('xoala/callback')
    @HttpCode(200)
    async xoalaCallback(@Body() body: any) {
        return this.xoalaWebhookService.handleCallback(body);
    }

    // Xoala: cardholder-return after 3DS. Xoala submits a form POST here
    // when the customer finishes the ACS challenge.
    //
    // Two jobs:
    //   1. Bounce the browser to the SPA success page (Vite/SPA hosts don't
    //      serve HTML on POST routes, hence the backend hop).
    //   2. If the POST body carries a signed status, treat it as a fallback
    //      webhook delivery and flip the payment row before the SPA polls —
    //      so the UI doesn't hang on "Confirming Your Payment…" when the
    //      real webhook is delayed/dropped/unreachable.
    //
    // The fallback uses the same handleCallback() that the webhook does, so
    // checksum + amount validation + idempotency are identical. Any failure
    // here is swallowed: the redirect must always happen so the user lands
    // somewhere instead of seeing a backend error page.
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

        if (body && body.merchantTransactionId && body.status && body.checksum) {
            try {
                const result = await this.xoalaWebhookService.handleCallback(body);
                this.logger.log(
                    `[Xoala Return] Fallback status update ref=${reference} result=${JSON.stringify(result).slice(0, 200)}`,
                );
            } catch (err: any) {
                this.logger.warn(
                    `[Xoala Return] Fallback status update failed ref=${reference} message=${err?.message} — webhook should still process this`,
                );
            }
        }

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
