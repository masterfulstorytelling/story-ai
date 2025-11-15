/**
 * Report Delivery Service
 *
 * Handles delivery of evaluation reports via email with PDF attachment.
 */

import { logger } from '../utils/logger';
import { sendEmail, EmailOptions } from './emailService';
import { ProcessingResult } from './aiProcessingService';
import { EvaluationRequest } from '../models/EvaluationRequest';

export interface ReportDeliveryOptions {
  evaluationRequest: EvaluationRequest;
  processingResult: ProcessingResult;
}

/**
 * Deliver evaluation report via email with PDF attachment
 *
 * @param options - Report delivery options
 * @throws Error if delivery fails
 */
export async function deliverReport(options: ReportDeliveryOptions): Promise<void> {
  const { evaluationRequest, processingResult } = options;
  const { email } = evaluationRequest;
  const { pdf_content } = processingResult;

  logger.info('Delivering evaluation report', {
    submissionId: evaluationRequest.id,
    email,
    hasPdfContent: !!pdf_content,
  });

  // Check if PDF content is available
  if (!pdf_content) {
    throw new Error('PDF content is missing from processing result');
  }

  // Convert base64 PDF content to buffer for attachment
  // pdf_content from AI processing should be base64-encoded bytes
  let pdfBuffer: Buffer;
  try {
    // If pdf_content is already a base64 string, decode it
    if (typeof pdf_content === 'string') {
      pdfBuffer = Buffer.from(pdf_content, 'base64');
    } else if (Buffer.isBuffer(pdf_content)) {
      pdfBuffer = pdf_content;
    } else {
      // If it's an object with base64 property
      const pdfData = pdf_content as { base64?: string; content?: string };
      const base64Content = pdfData.base64 || pdfData.content || '';
      pdfBuffer = Buffer.from(base64Content, 'base64');
    }
  } catch (error) {
    logger.error('Failed to decode PDF content', error, {
      submissionId: evaluationRequest.id,
    });
    throw new Error('Invalid PDF content format');
  }

  // Validate PDF buffer
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('PDF content is empty');
  }

  // Verify it's a valid PDF (starts with %PDF)
  if (!pdfBuffer.toString('ascii', 0, 4).startsWith('%PDF')) {
    logger.warn('PDF content does not appear to be valid PDF', {
      submissionId: evaluationRequest.id,
      firstBytes: pdfBuffer.toString('ascii', 0, 20),
    });
    // Continue anyway - might be valid but with different encoding
  }

  // Prepare email content
  const subject = 'Your Corporate Storytelling Evaluation Report is Ready';
  const text = `Dear ${email.split('@')[0]},

Your corporate storytelling evaluation report is ready!

We've completed a comprehensive analysis of your content and generated a detailed PDF report with our findings and recommendations.

Please find the report attached to this email.

Submission ID: ${evaluationRequest.id}

If you have any questions or need further assistance, please don't hesitate to reach out.

Best regards,
Feedforward AI Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0056b3;">Your Evaluation Report is Ready!</h2>
      <p>Dear ${email.split('@')[0]},</p>
      <p>Your corporate storytelling evaluation report is ready!</p>
      <p>We've completed a comprehensive analysis of your content and generated a detailed PDF report with our findings and recommendations.</p>
      <p><strong>Please find the report attached to this email.</strong></p>
      <p style="color: #666; font-size: 0.9em;">Submission ID: ${evaluationRequest.id}</p>
      <p>If you have any questions or need further assistance, please don't hesitate to reach out.</p>
      <p>Best regards,<br><strong>Feedforward AI Team</strong></p>
    </div>
  `;

  // Prepare email with PDF attachment
  const emailOptions: EmailOptions = {
    to: email,
    subject,
    text,
    html,
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: `evaluation-report-${evaluationRequest.id}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  };

  try {
    await sendEmail(emailOptions);
    logger.info('Report delivered successfully', {
      submissionId: evaluationRequest.id,
      email,
      pdfSize: pdfBuffer.length,
    });
  } catch (error) {
    logger.error('Failed to deliver report', error, {
      submissionId: evaluationRequest.id,
      email,
    });
    throw error;
  }
}
