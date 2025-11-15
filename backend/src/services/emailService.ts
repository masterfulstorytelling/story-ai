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
      from: env.sendgridFromEmail || 'noreply@feedforward.ai',
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

export interface ConfirmationEmailData {
  submissionId: string;
  estimatedWaitTime: string;
}

/**
 * Send confirmation email to user after submission
 */
export async function sendConfirmationEmail(
  email: string,
  data: ConfirmationEmailData
): Promise<void> {
  const subject = 'Your Storytelling Evaluation Request Has Been Received';
  const text = `Thank you for submitting your content for evaluation.

Your submission ID: ${data.submissionId}

We're analyzing your content and will send you a comprehensive PDF report within ${data.estimatedWaitTime}.

You'll receive an email with the report attached once the evaluation is complete.

Best regards,
Feedforward AI Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Thank you for your submission!</h2>
      <p>Your storytelling evaluation request has been received and is being processed.</p>
      <p><strong>Submission ID:</strong> ${data.submissionId}</p>
      <p>We're analyzing your content and will send you a comprehensive PDF report within <strong>${data.estimatedWaitTime}</strong>.</p>
      <p>You'll receive an email with the report attached once the evaluation is complete.</p>
      <p>Best regards,<br>Feedforward AI Team</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}
