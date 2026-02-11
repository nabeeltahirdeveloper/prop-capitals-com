import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TradingAccount } from '@prisma/client';
import sgMail from '@sendgrid/mail';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly isEnabled: boolean;
  private readonly timeoutMs: number;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    // Check if email is enabled (default: true in production, can be disabled for local dev)
    this.isEnabled = this.configService.get<string>('EMAIL_ENABLED', 'true') === 'true';

    // Configurable timeout (default: 10 seconds)
    this.timeoutMs = parseInt(this.configService.get<string>('EMAIL_TIMEOUT_MS', '10000'), 10);

    this.fromEmail = this.configService.get<string>('SENDGRID_FROM') || 'noreply@prop-capitals.com';

    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');

    if (!this.isEnabled) {
      this.logger.warn('Email sending is DISABLED (EMAIL_ENABLED=false). Emails will be logged but not sent.');
      return;
    }

    if (!apiKey) {
      this.logger.error(' SENDGRID_API_KEY is not set. Email sending will fail.');
      // Don't throw - allow app to start, but emails will fail gracefully
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      this.logger.log(' SendGrid configured successfully');
    } catch (error) {
      this.logger.error(`❌ Failed to configure SendGrid: ${error.message}`);
    }
  }

  /**
   * Send email with timeout and error handling
   * Returns result object instead of throwing
   */
  private async sendWithTimeout(mailOptions: sgMail.MailDataRequired): Promise<EmailResult> {
    // If disabled, log and return success (for dev/test environments)
    if (!this.isEnabled) {
      this.logger.log(` [DEV MODE] Would send email to: ${mailOptions.to}, subject: "${mailOptions.subject}"`);
      return { success: true, messageId: 'dev-mode-disabled' };
    }

    // If not configured, fail gracefully
    if (!this.isConfigured) {
      this.logger.error('Email not sent: SendGrid is not configured');
      return { success: false, error: 'Email service not configured', errorCode: 'NOT_CONFIGURED' };
    }

    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.timeoutMs);

    try {
      // Race between SendGrid call and timeout
      const sendPromise = sgMail.send(mailOptions);

      const result = await Promise.race([
        sendPromise,
        new Promise<never>((_, reject) => {
          abortController.signal.addEventListener('abort', () => {
            reject(new Error('EMAIL_TIMEOUT'));
          });
        }),
      ]);

      clearTimeout(timeoutId);

      // SendGrid returns [response, body] tuple
      const response = Array.isArray(result) ? result[0] : result;
      const messageId = response?.headers?.['x-message-id'] || 'unknown';

      this.logger.log(`Email sent successfully to ${mailOptions.to} (messageId: ${messageId})`);

      return { success: true, messageId };
    } catch (error) {
      clearTimeout(timeoutId);

      // Classify and log the error appropriately
      const { errorMessage, errorCode } = this.classifyError(error);

      this.logger.error(` Failed to send email to ${mailOptions.to}: ${errorMessage}`, {
        errorCode,
        subject: mailOptions.subject,
      });

      return { success: false, error: errorMessage, errorCode };
    }
  }

  /**
   * Classify SendGrid errors for better logging and handling
   */
  private classifyError(error: any): { errorMessage: string; errorCode: string } {
    const message = error?.message || 'Unknown error';

    // Timeout
    if (message === 'EMAIL_TIMEOUT' || message.includes('abort')) {
      return { errorMessage: `Email send timed out after ${this.timeoutMs}ms`, errorCode: 'TIMEOUT' };
    }

    // DNS resolution failures
    if (message.includes('ENOTFOUND') || message.includes('EAI_AGAIN') || message.includes('getaddrinfo')) {
      return { errorMessage: 'DNS resolution failed - check network connectivity', errorCode: 'DNS_ERROR' };
    }

    // Connection errors
    if (message.includes('ECONNREFUSED') || message.includes('ECONNRESET') || message.includes('ETIMEDOUT')) {
      return { errorMessage: 'Connection to SendGrid failed - network issue', errorCode: 'CONNECTION_ERROR' };
    }

    // SendGrid API errors (from response)
    if (error?.response) {
      const statusCode = error.response.statusCode;
      const body = error.response.body;

      // Authentication error
      if (statusCode === 401 || statusCode === 403) {
        return { errorMessage: 'SendGrid authentication failed - check API key', errorCode: 'AUTH_ERROR' };
      }

      // Rate limiting
      if (statusCode === 429) {
        return { errorMessage: 'SendGrid rate limit exceeded - too many requests', errorCode: 'RATE_LIMIT' };
      }

      // Bad request (invalid email, etc.)
      if (statusCode === 400) {
        const errorDetail = body?.errors?.[0]?.message || 'Invalid request';
        return { errorMessage: `SendGrid rejected request: ${errorDetail}`, errorCode: 'BAD_REQUEST' };
      }

      // Server errors
      if (statusCode >= 500) {
        return { errorMessage: `SendGrid server error (${statusCode})`, errorCode: 'SERVER_ERROR' };
      }

      return { errorMessage: `SendGrid error: ${statusCode} - ${JSON.stringify(body)}`, errorCode: 'API_ERROR' };
    }

    // Generic error
    return { errorMessage: message, errorCode: 'UNKNOWN' };
  }

  /**
   * Send OTP verification email for signup
   */
  async sendSignupOtpEmail(to: string, otp: string): Promise<EmailResult> {
    return this.sendWithTimeout({
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

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetToken: string, resetUrl: string): Promise<EmailResult> {
    return this.sendWithTimeout({
      to,
      from: this.fromEmail,
      subject: 'Reset your Props Capital password',
      text: `Click this link to reset your password: ${resetUrl}. This link expires in 1 hour.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="margin: 0 0 12px;">Reset your password</h2>
          <p style="margin: 0 0 12px;">Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 12px 0;">
            Reset Password
          </a>
          <p style="margin: 12px 0 0; color: #555;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  }

  /**
   * Send password reset OTP
   */
  async sendPasswordResetOtp(to: string, otp: string): Promise<EmailResult> {
    return this.sendWithTimeout({
      to,
      from: this.fromEmail,
      subject: 'Your Password Reset OTP',
      text: `Your password reset code is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="margin: 0 0 12px;">Password Reset Request</h2>
          <p style="margin: 0 0 12px;">Use this code to reset your password:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 12px 0; color: #DC2626;">
            ${otp}
          </div>
          <p style="margin: 12px 0 0; color: #555;">This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      `,
    });
  }

  /**
   * Send generic notification email
   */
  async sendNotificationEmail(to: string, subject: string, message: string): Promise<EmailResult> {
    return this.sendWithTimeout({
      to,
      from: this.fromEmail,
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <p>${message}</p>
        </div>
      `,
    });
  }

  /**
   * Send contact form confirmation email to user
   */
  async sendContactConfirmationEmail(
    to: string,
    name: string,
    subject: string,
  ): Promise<EmailResult> {
    return this.sendWithTimeout({
      to,
      from: this.fromEmail,
      subject: 'We received your message - Props Capital',
      text: `Hi ${name},\n\nThank you for contacting Props Capital. We have received your message regarding "${subject}" and will get back to you within 24 hours.\n\nBest regards,\nProps Capital Support Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0; font-size: 28px;">Props Capital</h1>
            </div>

            <h2 style="color: #1f2937; margin: 0 0 16px;">Thank You for Contacting Us</h2>

            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">Hi ${name},</p>

            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
              We have received your message regarding <strong>"${subject}"</strong> and our support team will review it shortly.
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #065f46; margin: 0; font-weight: 500;">
                ✓ Expected Response Time: Within 24 hours
              </p>
            </div>

            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
              If you have any urgent questions, you can also reach us at:
            </p>

            <ul style="color: #4b5563; line-height: 1.8; margin: 0 0 24px;">
              <li>Email: <a href="mailto:support@prop-capitals.com" style="color: #10b981;">support@prop-capitals.com</a></li>
              <li>Live Chat: Available 24/7 on our website</li>
            </ul>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong>Props Capital Support Team</strong>
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Props Capital. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  }

  /**
   * Send contact form notification to support team
   */
  async sendContactNotificationToSupport(
    userName: string,
    userEmail: string,
    category: string,
    subject: string,
    message: string,
  ): Promise<EmailResult> {
    const supportEmail = this.configService.get<string>('SUPPORT_EMAIL') || 'support@prop-capitals.com';

    return this.sendWithTimeout({
      to: supportEmail,
      from: this.fromEmail,
      replyTo: userEmail,
      subject: `[Contact Form] ${category}: ${subject}`,
      text: `New contact form submission:\n\nName: ${userName}\nEmail: ${userEmail}\nCategory: ${category}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">New Contact Form Submission</h2>
          </div>

          <div style="background-color: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Name:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${userName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Email:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                  <a href="mailto:${userEmail}" style="color: #3b82f6; text-decoration: none;">${userEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Category:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 14px;">
                    ${category}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Subject:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">${subject}</td>
              </tr>
            </table>

            <div style="margin-top: 24px;">
              <h3 style="color: #374151; margin: 0 0 12px;">Message:</h3>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                <p style="color: #4b5563; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            </div>

            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <a href="mailto:${userEmail}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Reply to ${userName}
              </a>
            </div>
          </div>
        </div>
      `,
    });
  }

  /**
   * Check if email service is operational
   */
  isOperational(): boolean {
    return this.isEnabled && this.isConfigured;
  }

  /**
   * Get service status for health checks
   */
  getStatus(): { enabled: boolean; configured: boolean; fromEmail: string } {
    return {
      enabled: this.isEnabled,
      configured: this.isConfigured,
      fromEmail: this.fromEmail,
    };
  }

  /**
   * Send platform account credentials email
   */
  async sendPlatformAccountCredentials(
    to: string,
    email: string,
    password: string,
    cardData: Pick<TradingAccount, 'id' | 'platform'>,
  ): Promise<EmailResult> {
    return this.sendWithTimeout({
      to,
      from: this.fromEmail,
      subject: `Your Props Capital ${cardData.platform} Account Credentials`,
      text: `Your Props Capital ${cardData.platform} account has been created.\n\nEmail: ${email}\nPassword: ${password}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="margin: 0 0 12px;">Your account is ready</h2>
          <p style="margin: 0 0 12px;">Your Props Capital platform account has been created with the following credentials:</p>
          <div style="margin: 12px 0; padding: 12px; background-color: #f9fafb; border-radius: 4px;">
            <p style="margin: 0 0 8px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
          </div>
        </div>
      `,
    });
  }

}
