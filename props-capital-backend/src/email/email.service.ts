import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM') || 'noreply@propel-capital.com';

    if (!apiKey) {
      // Fail fast so signup/OTP doesn’t silently “work” without actually emailing.
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }

    sgMail.setApiKey(apiKey);
  }

  async sendSignupOtpEmail(to: string, otp: string) {
    await sgMail.send({
      to,
      from: this.fromEmail,
      subject: 'Your Props Capital verification code',
      text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="margin: 0 0 12px;">Verify your email</h2>
          <p style="margin: 0 0 12px;">Use this code to complete your signup:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 12px 0;">
            ${otp}
          </div>
          <p style="margin: 12px 0 0; color: #555;">This code expires in 10 minutes.</p>
        </div>
      `,
    });
  }
}


