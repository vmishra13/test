import {
  GetSecretValueCommand,
  CreateSecretCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
  ListSecretsCommand,
  PutSecretValueCommand,
  DescribeSecretCommand,
  RestoreSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

// Initialize AWS Secrets Manager client
export const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export interface SecretData {
  name: string;
  description?: string;
  secretString?: string;
  secretBinary?: Uint8Array;
  tags?: Array<{ Key: string; Value: string }>;
}

export interface DatabaseCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export interface ApiCredentials {
  apiKey: string;
  apiSecret: string;
  endpoint: string;
}

export class SecretsService {
  /**
   * Get secret value
   */
  async getSecret(secretName: string): Promise<{
    secretString?: string;
    secretBinary?: Uint8Array;
    versionId: string;
  }> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const result = await secretsClient.send(command);
      return {
        secretString: result.SecretString,
        secretBinary: result.SecretBinary,
        versionId: result.VersionId!,
      };
    } catch (error) {
      console.error('Secrets Manager get secret error:', error);
      throw new Error(`Failed to get secret: ${error}`);
    }
  }

  /**
   * Get secret as JSON object
   */
  async getSecretAsJson<T = any>(secretName: string): Promise<T> {
    try {
      const { secretString } = await this.getSecret(secretName);
      if (!secretString) {
        throw new Error('Secret string is empty');
      }
      return JSON.parse(secretString) as T;
    } catch (error) {
      console.error('Secrets Manager get secret as JSON error:', error);
      throw new Error(`Failed to get secret as JSON: ${error}`);
    }
  }

  /**
   * Create new secret
   */
  async createSecret(secretData: SecretData): Promise<{ arn: string; versionId: string }> {
    try {
      const command = new CreateSecretCommand({
        Name: secretData.name,
        Description: secretData.description,
        SecretString: secretData.secretString,
        SecretBinary: secretData.secretBinary,
        Tags: secretData.tags,
      });

      const result = await secretsClient.send(command);
      return {
        arn: result.ARN!,
        versionId: result.VersionId!,
      };
    } catch (error) {
      console.error('Secrets Manager create secret error:', error);
      throw new Error(`Failed to create secret: ${error}`);
    }
  }

  /**
   * Update secret value
   */
  async updateSecret(
    secretName: string,
    secretString?: string,
    secretBinary?: Uint8Array
  ): Promise<{ arn: string; versionId: string }> {
    try {
      const command = new UpdateSecretCommand({
        SecretId: secretName,
        SecretString: secretString,
        SecretBinary: secretBinary,
      });

      const result = await secretsClient.send(command);
      return {
        arn: result.ARN!,
        versionId: result.VersionId!,
      };
    } catch (error) {
      console.error('Secrets Manager update secret error:', error);
      throw new Error(`Failed to update secret: ${error}`);
    }
  }

  /**
   * Delete secret
   */
  async deleteSecret(
    secretName: string,
    forceDelete: boolean = false,
    recoveryWindowInDays?: number
  ): Promise<{ arn: string; deletionDate: Date }> {
    try {
      const command = new DeleteSecretCommand({
        SecretId: secretName,
        ForceDeleteWithoutRecovery: forceDelete,
        RecoveryWindowInDays: recoveryWindowInDays,
      });

      const result = await secretsClient.send(command);
      return {
        arn: result.ARN!,
        deletionDate: result.DeletionDate!,
      };
    } catch (error) {
      console.error('Secrets Manager delete secret error:', error);
      throw new Error(`Failed to delete secret: ${error}`);
    }
  }

  /**
   * List secrets
   */
  async listSecrets(): Promise<Array<{
    arn: string;
    name: string;
    description?: string;
    lastChangedDate?: Date;
    tags?: Array<{ Key: string; Value: string }>;
  }>> {
    try {
      const command = new ListSecretsCommand({});
      const result = await secretsClient.send(command);

      return result.SecretList?.map(secret => ({
        arn: secret.ARN!,
        name: secret.Name!,
        description: secret.Description,
        lastChangedDate: secret.LastChangedDate,
        tags: secret.Tags?.filter(tag => tag.Key && tag.Value).map(tag => ({
          Key: tag.Key!,
          Value: tag.Value!,
        })),
      })) || [];
    } catch (error) {
      console.error('Secrets Manager list secrets error:', error);
      throw new Error(`Failed to list secrets: ${error}`);
    }
  }

  /**
   * Describe secret
   */
  async describeSecret(secretName: string): Promise<{
    arn: string;
    name: string;
    description?: string;
    createdDate?: Date;
    lastChangedDate?: Date;
    lastAccessedDate?: Date;
    tags?: Array<{ Key: string; Value: string }>;
  }> {
    try {
      const command = new DescribeSecretCommand({
        SecretId: secretName,
      });

      const result = await secretsClient.send(command);
      return {
        arn: result.ARN!,
        name: result.Name!,
        description: result.Description,
        createdDate: result.CreatedDate,
        lastChangedDate: result.LastChangedDate,
        lastAccessedDate: result.LastAccessedDate,
        tags: result.Tags?.filter(tag => tag.Key && tag.Value).map(tag => ({
          Key: tag.Key!,
          Value: tag.Value!,
        })),
      };
    } catch (error) {
      console.error('Secrets Manager describe secret error:', error);
      throw new Error(`Failed to describe secret: ${error}`);
    }
  }

  /**
   * Restore deleted secret
   */
  async restoreSecret(secretName: string): Promise<{ arn: string }> {
    try {
      const command = new RestoreSecretCommand({
        SecretId: secretName,
      });

      const result = await secretsClient.send(command);
      return { arn: result.ARN! };
    } catch (error) {
      console.error('Secrets Manager restore secret error:', error);
      throw new Error(`Failed to restore secret: ${error}`);
    }
  }

  /**
   * Get database credentials
   */
  async getDatabaseCredentials(secretName: string): Promise<DatabaseCredentials> {
    return this.getSecretAsJson<DatabaseCredentials>(secretName);
  }

  /**
   * Get API credentials
   */
  async getApiCredentials(secretName: string): Promise<ApiCredentials> {
    return this.getSecretAsJson<ApiCredentials>(secretName);
  }

  /**
   * Store database credentials
   */
  async storeDatabaseCredentials(
    secretName: string,
    credentials: DatabaseCredentials,
    description?: string
  ): Promise<{ arn: string; versionId: string }> {
    return this.createSecret({
      name: secretName,
      description: description || `Database credentials for ${credentials.database}`,
      secretString: JSON.stringify(credentials),
      tags: [
        { Key: 'Type', Value: 'DatabaseCredentials' },
        { Key: 'Database', Value: credentials.database },
      ],
    });
  }

  /**
   * Store API credentials
   */
  async storeApiCredentials(
    secretName: string,
    credentials: ApiCredentials,
    description?: string
  ): Promise<{ arn: string; versionId: string }> {
    return this.createSecret({
      name: secretName,
      description: description || `API credentials for ${credentials.endpoint}`,
      secretString: JSON.stringify(credentials),
      tags: [
        { Key: 'Type', Value: 'ApiCredentials' },
        { Key: 'Endpoint', Value: credentials.endpoint },
      ],
    });
  }

  /**
   * Get JWT secret for authentication
   */
  async getJwtSecret(): Promise<string> {
    try {
      const { secretString } = await this.getSecret('reliacare/jwt-secret');
      return secretString!;
    } catch (error) {
      console.error('Failed to get JWT secret:', error);
      throw new Error('JWT secret not found');
    }
  }

  /**
   * Get encryption keys
   */
  async getEncryptionKeys(): Promise<{
    publicKey: string;
    privateKey: string;
  }> {
    return this.getSecretAsJson('reliacare/encryption-keys');
  }

  /**
   * Get FHIR API credentials
   */
  async getFhirCredentials(clientId: string): Promise<{
    clientId: string;
    clientSecret: string;
    serverUrl: string;
    scopes: string[];
  }> {
    return this.getSecretAsJson(`reliacare/fhir-credentials/${clientId}`);
  }
}

export const secretsService = new SecretsService();