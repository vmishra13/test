/**
 * AWS Services Integration Module
 * 
 * This module provides comprehensive AWS service integrations for:
 * - SES (Simple Email Service) - Email notifications and templating
 * - SNS (Simple Notification Service) - SMS and Push notifications (APNS/FCM)
 * - Secrets Manager - Secure credential and secret management
 * - S3 (Simple Storage Service) - File storage and management
 */

// Export AWS configuration
export { awsConfig, sesClient, snsClient, secretsClient, s3Client } from './config';

// Export service classes
export { SESService } from './services/ses.service';
export { SNSService, snsService } from './services/sns.service';
export { SecretsService, secretsService } from './services/secrets.service';
export { S3Service, s3Service } from './services/s3.service';

// Import service classes for internal use
import { SESService } from './services/ses.service';
import { snsService } from './services/sns.service';
import { secretsService } from './services/secrets.service';
import { s3Service } from './services/s3.service';

// Export SES types
export type {
  EmailData,
  TemplatedEmailData,
  EmailTemplate,
} from './services/ses.service';

// Export SNS types
export type {
  NotificationData,
  TopicData,
  SubscriptionData,
  PlatformApplicationData,
  PlatformEndpointData,
  PushNotificationPayload,
  APNSPayload,
  GCMPayload,
  FCMPayload,
} from './services/sns.service';

// Export Secrets Manager types
export type {
  SecretData,
  DatabaseCredentials,
  ApiCredentials,
} from './services/secrets.service';

// Export S3 types
export type {
  UploadData,
  DownloadData,
  FileMetadata,
} from './services/s3.service';

// Aggregate service instance for convenience
export const awsServices = {
  ses: new SESService(),
  sns: snsService,
  secrets: secretsService,
  s3: s3Service,
} as const;

// Default export
export default awsServices;