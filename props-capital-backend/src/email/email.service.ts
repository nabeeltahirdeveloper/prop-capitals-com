import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
}