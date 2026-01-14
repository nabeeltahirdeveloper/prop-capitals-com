// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import sgMail from '@sendgrid/mail';

// @Injectable()
// export class EmailService {
//   private readonly logger = new Logger(EmailService.name);
//   private readonly fromEmail: string;
//   private readonly emailEnabled: boolean;
//   private readonly TIMEOUT_MS = 10000; // 10 second timeout for email send

//   constructor(private readonly configService: ConfigService) {
//     const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
//     this.fromEmail = this.configService.get<string>('SENDGRID_FROM') || 'noreply@prop-capitals.com';

//     // Allow disabling email in dev/local via env flag
//     const emailDisabled = this.configService.get<string>('DISABLE_EMAIL') === 'true';

//     if (emailDisabled) {
//       this.emailEnabled = false;
//       this.logger.warn('⚠️ Email sending is DISABLED (DISABLE_EMAIL=true)');
//       return;
//     }

//     if (!apiKey) {
//       // In production, this is critical. In dev, we can continue with emails disabled.
//       const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
//       if (nodeEnv === 'production') {
//         throw new Error('SENDGRID_API_KEY environment variable is required in production');
//       } else {
//         this.emailEnabled = false;
//         this.logger.warn('⚠️ SENDGRID_API_KEY not set - email sending disabled for dev/local');
//         return;
//       }
//     }

//     this.emailEnabled = true;
//     sgMail.setApiKey(apiKey);
//     this.logger.log('✅ SendGrid email service initialized');
//   }

//   async sendSignupOtpEmail(to: string, otp: string): Promise<void> {
//     // If email is disabled, log and return (don't throw)
//     if (!this.emailEnabled) {
//       this.logger.warn(`📧 Email DISABLED - Would have sent OTP ${otp} to ${to}`);
//       return;
//     }

//     const maxRetries = 2;
//     const retryDelay = 1000;

//     for (let attempt = 0; attempt < maxRetries; attempt++) {
//       try {
//         // Wrap in timeout promise
//         await Promise.race([
//           sgMail.send({
//             to,
//             from: this.fromEmail,
//             subject: 'Your Props Capital verification code',
//             text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
//             html: `
//               <div style="font-family: Arial, sans-serif; line-height: 1.5;">
//                 <h2 style="margin: 0 0 12px;">Verify your email</h2>
//                 <p style="margin: 0 0 12px;">Use this code to complete your signup:</p>
//                 <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 12px 0;">
//                   ${otp}
//                 </div>
//                 <p style="margin: 12px 0 0; color: #555;">This code expires in 10 minutes.</p>
//               </div>
//             `,
//           }),
//           new Promise((_, reject) =>
//             setTimeout(() => reject(new Error('SendGrid timeout')), this.TIMEOUT_MS)
//           ),
//         ]);

//         // Success
//         if (attempt > 0) {
//           this.logger.log(`✅ Email sent after ${attempt} retries to ${to}`);
//         }
//         return;
//       } catch (error) {
//         const isLastAttempt = attempt === maxRetries - 1;

//         // Log error details
//         this.logger.error(
//           `SendGrid error (attempt ${attempt + 1}/${maxRetries}): ${error.message}`,
//           error.stack
//         );

//         if (isLastAttempt) {
//           // Don't crash the app - throw a user-friendly error
//           throw new Error(
//             `Failed to send verification email after ${maxRetries} attempts. Please try again or contact support.`
//           );
//         }

//         // Wait before retry
//         await new Promise(resolve => setTimeout(resolve, retryDelay));
//       }
//     }
//   }
// }
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail =
      this.configService.get<string>('SENDGRID_FROM') ||
      'noreply@prop-capitals.com';

    if (!apiKey) {
      this.logger.error('❌ SENDGRID_API_KEY is missing in .env');
    } else {
      sgMail.setApiKey(apiKey);
      this.logger.log('✅ SendGrid API Key loaded');
    }

    if (!this.fromEmail) {
      this.logger.error('❌ SENDGRID_FROM is missing in .env');
    } else {
      this.logger.log(`✅ Sending emails from: ${this.fromEmail}`);
    }
  }

  async sendSignupOtpEmail(to: string, otp: string) {

    const msg = {
      to,
      from: this.fromEmail, // Must match your SendGrid Verified Sender EXACTLY
      subject: 'Your Verification Code',
      text: `Your code is: ${otp}`,
      html: `<strong>Your code is: ${otp}</strong>`,
    };
    // const msg = {
    //   to,
    //   from: this.fromEmail,
    //   subject: 'Your Props Capital verification code',
    //   text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
    //   html: `
    //           <div style="font-family: Arial, sans-serif; line-height: 1.5;">
    //             <h2 style="margin: 0 0 12px;">Verify your email</h2>
    //             <p style="margin: 0 0 12px;">Use this code to complete your signup:</p>
    //             <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 12px 0;">
    //               ${otp}
    //             </div>
    //             <p style="margin: 12px 0 0; color: #555;">This code expires in 10 minutes.</p>
    //           </div>
    //         `,
    // };

    try {
      this.logger.log(`⏳ Attempting to send email to ${to}...`);
      await sgMail.send(msg);
      this.logger.log(`✅ Email successfully sent to ${to}`);
    } catch (error) {
      // 🚨 THIS LOG WILL TELL YOU THE PROBLEM
      this.logger.error(`❌ SendGrid Error: ${error.message}`);
      if (error.response) {
        this.logger.error(
          `🔍 Full Error Details: ${JSON.stringify(error.response.body)}`,
        );
      }
    }
  }
}
