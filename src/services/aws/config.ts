import { SESClient } from '@aws-sdk/client-ses';
import { SNSClient as SNSClientImport } from '@aws-sdk/client-sns';
import { SecretsManagerClient as SecretsClientImport } from '@aws-sdk/client-secrets-manager';
import { S3Client as S3ClientImport } from '@aws-sdk/client-s3';

export interface AWSConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
}

export const awsConfig: AWSConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
};

// Initialize AWS clients
export const sesClient = new SESClient(awsConfig);
export const snsClient = new SNSClientImport(awsConfig);
export const secretsClient = new SecretsClientImport(awsConfig);
export const s3Client = new S3ClientImport(awsConfig);