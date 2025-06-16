import { 
  SendEmailCommand, 
  SendBulkTemplatedEmailCommand,
  SendTemplatedEmailCommand,
  CreateTemplateCommand,
  DeleteTemplateCommand,
  GetTemplateCommand,
  ListTemplatesCommand,
  VerifyEmailIdentityCommand,
  DeleteIdentityCommand,
  GetIdentityVerificationAttributesCommand
} from '@aws-sdk/client-ses';
import { SESClient } from '@aws-sdk/client-ses';

// Configure SES client
export const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface EmailData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  from?: string;
  replyTo?: string[];
}

export interface TemplatedEmailData {
  to: string[];
  templateName: string;
  templateData: Record<string, any>;
  from?: string;
  replyTo?: string[];
}

export interface EmailTemplate {
  templateName: string;
  subject: string;
  htmlPart?: string;
  textPart?: string;
}

export class SESService {
  private readonly defaultFromEmail: string;

  constructor() {
    this.defaultFromEmail = process.env.SES_DEFAULT_FROM_EMAIL || 'noreply@reliacare.com';
  }

  /**
   * Send a simple email
   */
  async sendEmail(emailData: EmailData): Promise<{ messageId: string }> {
    try {
      const command = new SendEmailCommand({
        Source: emailData.from || this.defaultFromEmail,
        Destination: {
          ToAddresses: emailData.to,
          CcAddresses: emailData.cc,
          BccAddresses: emailData.bcc,
        },
        Message: {
          Subject: {
            Data: emailData.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: emailData.htmlBody ? {
              Data: emailData.htmlBody,
              Charset: 'UTF-8',
            } : undefined,
            Text: emailData.textBody ? {
              Data: emailData.textBody,
              Charset: 'UTF-8',
            } : undefined,
          },
        },
        ReplyToAddresses: emailData.replyTo,
      });

      const result = await sesClient.send(command);
      return { messageId: result.MessageId! };
    } catch (error) {
      console.error('SES send email error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  /**
   * Send templated email
   */
  async sendTemplatedEmail(emailData: TemplatedEmailData): Promise<{ messageId: string }> {
    try {
      const command = new SendTemplatedEmailCommand({
        Source: emailData.from || this.defaultFromEmail,
        Destination: {
          ToAddresses: emailData.to,
        },
        Template: emailData.templateName,
        TemplateData: JSON.stringify(emailData.templateData),
        ReplyToAddresses: emailData.replyTo,
      });

      const result = await sesClient.send(command);
      return { messageId: result.MessageId! };
    } catch (error) {
      console.error('SES send templated email error:', error);
      throw new Error(`Failed to send templated email: ${error}`);
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmail(
    template: string,
    destinations: Array<{
      email: string;
      templateData: Record<string, any>;
    }>
  ): Promise<{ messageIds: string[] }> {
    try {
      const command = new SendBulkTemplatedEmailCommand({
        Source: this.defaultFromEmail,
        Template: template,
        DefaultTemplateData: JSON.stringify({}),
        Destinations: destinations.map(dest => ({
          Destination: {
            ToAddresses: [dest.email],
          },
          ReplacementTemplateData: JSON.stringify(dest.templateData),
        })),
      });

      const result = await sesClient.send(command);
      return { 
        messageIds: result.Status?.map(status => status.MessageId).filter(Boolean) as string[] || []
      };
    } catch (error) {
      console.error('SES send bulk email error:', error);
      throw new Error(`Failed to send bulk email: ${error}`);
    }
  }

  /**
   * Create email template
   */
  async createTemplate(template: EmailTemplate): Promise<void> {
    try {
      const command = new CreateTemplateCommand({
        Template: {
          TemplateName: template.templateName,
          SubjectPart: template.subject,
          HtmlPart: template.htmlPart,
          TextPart: template.textPart,
        },
      });

      await sesClient.send(command);
    } catch (error) {
      console.error('SES create template error:', error);
      throw new Error(`Failed to create email template: ${error}`);
    }
  }

  /**
   * Delete email template
   */
  async deleteTemplate(templateName: string): Promise<void> {
    try {
      const command = new DeleteTemplateCommand({
        TemplateName: templateName,
      });

      await sesClient.send(command);
    } catch (error) {
      console.error('SES delete template error:', error);
      throw new Error(`Failed to delete email template: ${error}`);
    }
  }

  /**
   * Get email template
   */
  async getTemplate(templateName: string): Promise<EmailTemplate> {
    try {
      const command = new GetTemplateCommand({
        TemplateName: templateName,
      });

      const result = await sesClient.send(command);
      return {
        templateName: result.Template!.TemplateName!,
        subject: result.Template!.SubjectPart!,
        htmlPart: result.Template!.HtmlPart,
        textPart: result.Template!.TextPart,
      };
    } catch (error) {
      console.error('SES get template error:', error);
      throw new Error(`Failed to get email template: ${error}`);
    }
  }

  /**
   * List email templates
   */
  async listTemplates(): Promise<EmailTemplate[]> {
    try {
      const command = new ListTemplatesCommand({});
      const result = await sesClient.send(command);

      return result.TemplatesMetadata?.map(template => ({
        templateName: template.Name!,
        subject: '', // Subject not included in list response
        createdAt: template.CreatedTimestamp,
      })) || [];
    } catch (error) {
      console.error('SES list templates error:', error);
      throw new Error(`Failed to list email templates: ${error}`);
    }
  }

  /**
   * Verify email identity
   */
  async verifyEmailIdentity(email: string): Promise<void> {
    try {
      const command = new VerifyEmailIdentityCommand({
        EmailAddress: email,
      });

      await sesClient.send(command);
    } catch (error) {
      console.error('SES verify email error:', error);
      throw new Error(`Failed to verify email identity: ${error}`);
    }
  }

  /**
   * Check email verification status
   */
  async getVerificationStatus(email: string): Promise<{
    isVerified: boolean;
    status: string;
  }> {
    try {
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [email],
      });

      const result = await sesClient.send(command);
      const attributes = result.VerificationAttributes?.[email];

      return {
        isVerified: attributes?.VerificationStatus === 'Success',
        status: attributes?.VerificationStatus || 'Pending',
      };
    } catch (error) {
      console.error('SES get verification status error:', error);
      throw new Error(`Failed to get verification status: ${error}`);
    }
  }

  /**
   * Send patient appointment reminder
   */
  async sendAppointmentReminder(
    patientEmail: string,
    appointmentData: {
      patientName: string;
      doctorName: string;
      appointmentDate: string;
      appointmentTime: string;
      clinicName: string;
      clinicAddress: string;
    }
  ): Promise<{ messageId: string }> {
    const emailData: EmailData = {
      to: [patientEmail],
      subject: `Appointment Reminder - ${appointmentData.appointmentDate}`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Appointment Reminder</h2>
          <p>Dear ${appointmentData.patientName},</p>
          <p>This is a reminder for your upcoming appointment:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <strong>Doctor:</strong> ${appointmentData.doctorName}<br>
            <strong>Date:</strong> ${appointmentData.appointmentDate}<br>
            <strong>Time:</strong> ${appointmentData.appointmentTime}<br>
            <strong>Location:</strong> ${appointmentData.clinicName}<br>
            <strong>Address:</strong> ${appointmentData.clinicAddress}
          </div>
          <p>Please arrive 15 minutes early for check-in.</p>
          <p>If you need to reschedule, please contact us as soon as possible.</p>
          <p>Best regards,<br>ReliaCare Team</p>
        </div>
      `,
      textBody: `
        Appointment Reminder
        
        Dear ${appointmentData.patientName},
        
        This is a reminder for your upcoming appointment:
        
        Doctor: ${appointmentData.doctorName}
        Date: ${appointmentData.appointmentDate}
        Time: ${appointmentData.appointmentTime}
        Location: ${appointmentData.clinicName}
        Address: ${appointmentData.clinicAddress}
        
        Please arrive 15 minutes early for check-in.
        
        Best regards,
        ReliaCare Team
      `,
    };

    return this.sendEmail(emailData);
  }
}

export const sesService = new SESService();