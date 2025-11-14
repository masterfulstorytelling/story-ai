import sgMail from '@sendgrid/mail';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let emailServiceInitialized = false;

export function initializeEmailService(): void {
  if (!emailServiceInitialized) {
    if (!env.sendgridApiKey) {
      throw new Error('SENDGRID_API_KEY is required');
    }
    sgMail.setApiKey(env.sendgridApiKey);
    emailServiceInitialized = true;
    logger.info('SendGrid email service initialized');
  }
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!emailServiceInitialized) {
    initializeEmailService();
  }

  try {
    await sgMail.send({
      from: 'noreply@feedforward.ai', // TODO: Update with your verified sender
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });
    logger.info('Email sent successfully', { to: options.to, subject: options.subject });
  } catch (error) {
    logger.error('Failed to send email', error, { to: options.to, subject: options.subject });
    throw error;
  }
}

