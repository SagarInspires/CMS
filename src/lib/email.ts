import { Resend } from 'resend';

export interface SendVerificationEmailInput {
  recipient: string;
  verificationUrl: string;
}

export interface EmailProvider {
  sendVerificationEmail(input: SendVerificationEmailInput): Promise<void>;
}

// Development provider: safely logs the email instead of sending it
class DevelopmentEmailProvider implements EmailProvider {
  async sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
    console.log('\n=========================================');
    console.log('📧 DEVELOPMENT EMAIL SENT');
    console.log(`To: ${input.recipient}`);
    console.log(`Subject: Verify your EditorialFlow account`);
    console.log(`Body: Click the link below to verify your email address:\n${input.verificationUrl}`);
    console.log('=========================================\n');
  }
}

// Resend Production Provider
class ResendEmailProvider implements EmailProvider {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CRITICAL: RESEND_API_KEY and EMAIL_FROM must be configured in production.');
      } else {
        console.warn('Warning: RESEND configuration missing. Emails will fail if attempting to use ResendEmailProvider.');
      }
    }

    this.resend = new Resend(apiKey || 'dummy');
    this.fromEmail = from || 'noreply@example.com';
  }

  async sendVerificationEmail(input: SendVerificationEmailInput): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: `EditorialFlow <${this.fromEmail}>`,
        to: input.recipient,
        subject: 'Verify your EditorialFlow account',
        html: `<p>Welcome to EditorialFlow!</p><p>Please verify your email by clicking the link below:</p><p><a href="${input.verificationUrl}">Verify Email</a></p>`,
        text: `Verify your email: ${input.verificationUrl}`
      });

      if (error) {
        throw new Error(`Resend API Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send verification email. Please try again later.');
    }
  }
}

// Export the correct provider based on environment
export const emailProvider: EmailProvider =
  process.env.NODE_ENV === 'production'
    ? new ResendEmailProvider()
    : new DevelopmentEmailProvider();
