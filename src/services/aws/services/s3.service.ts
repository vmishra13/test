import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  GetObjectAttributesCommand,
  PutObjectAclCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import crypto from 'crypto';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface UploadData {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array | string | Readable;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
}

export interface DownloadData {
  bucket: string;
  key: string;
  range?: string;
}

export interface FileMetadata {
  key: string;
  encodedUrl: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StreamUploadData {
  bucket: string;
  key: string;
  body: Buffer | Uint8Array | string | Readable;
  contentType: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  enableStreaming?: boolean;
}

export interface EncodedMediaResponse {
  mediaId: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  encodedUrl: string; // This will be the encoded URL
}

export class S3Service {
  private readonly defaultBucket: string;
  private readonly encryptionKey: string;

  constructor() {
    this.defaultBucket = process.env.S3_DEFAULT_BUCKET || 'reliacare-storage';
    this.encryptionKey = process.env.MEDIA_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  /**
   * Encrypt S3 key and bucket info into a secure token
   */
  private encodeMediaUrl(bucket: string, key: string, contentType: string): string {
    const payload = {
      bucket,
      key,
      contentType,
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    const iv = crypto.randomBytes(16);
    const key32 = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key32, iv);
    let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const combined = iv.toString('hex') + ':' + encrypted;
    return Buffer.from(combined).toString('base64url');
  }

  /**
   * Decrypt encoded media URL to get S3 info
   */
  private decodeMediaUrl(encodedUrl: string): { bucket: string; key: string; contentType: string } {
    try {
      const combined = Buffer.from(encodedUrl, 'base64url').toString();
      const [ivHex, encrypted] = combined.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const key32 = crypto.createHash('sha256').update(this.encryptionKey).digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', key32, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const payload = JSON.parse(decrypted);
      
      // Check if token has expired
      if (Date.now() > payload.expires) {
        throw new Error('Media URL has expired');
      }
      
      return {
        bucket: payload.bucket,
        key: payload.key,
        contentType: payload.contentType
      };
    } catch (error) {
      throw new Error('Invalid or expired media URL');
    }
  }

  /**
   * Helper method to get file extension from content type
   */
  private getFileExtension(contentType: string): string {
    const extensions: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/ogg': '.ogv',
      'video/avi': '.avi',
      'video/mov': '.mov',
      'video/wmv': '.wmv',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    };
    
    return extensions[contentType.toLowerCase()] || '';
  }

  /**
   * Upload file to S3 (updated to return encoded URL)
   */
  async uploadFile(uploadData: UploadData): Promise<{
    bucket: string;
    key: string;
    etag: string;
    encodedUrl: string;
  }> {
    try {
      const command = new PutObjectCommand({
        Bucket: uploadData.bucket,
        Key: uploadData.key,
        Body: uploadData.body,
        ContentType: uploadData.contentType,
        Metadata: uploadData.metadata,
        Tagging: uploadData.tags ? Object.entries(uploadData.tags)
          .map(([key, value]) => `${key}=${value}`)
          .join('&') : undefined,
        ACL: uploadData.acl,
      });

      const result = await s3Client.send(command);
      const encodedUrl = this.encodeMediaUrl(
        uploadData.bucket, 
        uploadData.key, 
        uploadData.contentType || 'application/octet-stream'
      );

      return {
        bucket: uploadData.bucket,
        key: uploadData.key,
        etag: result.ETag!,
        encodedUrl,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  /**
   * Download file from S3 (accepts encoded URL)
   */
  async downloadFile(encodedUrl: string, range?: string): Promise<{
    body: Readable;
    contentType?: string;
    contentLength?: number;
    lastModified?: Date;
    metadata?: Record<string, string>;
  }> {
    try {
      const { bucket, key } = this.decodeMediaUrl(encodedUrl);

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: range,
      });

      const result = await s3Client.send(command);
      return {
        body: result.Body as Readable,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        metadata: result.Metadata,
      };
    } catch (error) {
      console.error('S3 download error:', error);
      throw new Error(`Failed to download file: ${error}`);
    }
  }

  /**
   * Delete file from S3 (accepts encoded URL)
   */
  async deleteFile(encodedUrl: string): Promise<void> {
    try {
      const { bucket, key } = this.decodeMediaUrl(encodedUrl);

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Check if file exists (accepts encoded URL)
   */
  async fileExists(encodedUrl: string): Promise<boolean> {
    try {
      const { bucket, key } = this.decodeMediaUrl(encodedUrl);

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      console.error('S3 file exists check error:', error);
      throw new Error(`Failed to check file existence: ${error}`);
    }
  }

  /**
   * Get file metadata (accepts encoded URL)
   */
  async getFileMetadata(encodedUrl: string): Promise<FileMetadata> {
    try {
      const { bucket, key, contentType } = this.decodeMediaUrl(encodedUrl);

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const result = await s3Client.send(command);
      return {
        key,
        encodedUrl,
        size: result.ContentLength!,
        lastModified: result.LastModified!,
        etag: result.ETag!,
        contentType: result.ContentType,
        metadata: result.Metadata,
      };
    } catch (error) {
      console.error('S3 get metadata error:', error);
      throw new Error(`Failed to get file metadata: ${error}`);
    }
  }

  /**
   * List files in bucket (returns encoded URLs)
   */
  async listFiles(
    bucket: string,
    prefix?: string,
    maxKeys?: number
  ): Promise<{
    files: FileMetadata[];
    truncated: boolean;
    nextToken?: string;
  }> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const result = await s3Client.send(command);
      const files = await Promise.all(
        (result.Contents || []).map(async (obj) => {
          // Get content type for each file
          const headCommand = new HeadObjectCommand({
            Bucket: bucket,
            Key: obj.Key!,
          });
          const headResult = await s3Client.send(headCommand);
          
          const encodedUrl = this.encodeMediaUrl(
            bucket, 
            obj.Key!, 
            headResult.ContentType || 'application/octet-stream'
          );

          return {
            key: obj.Key!,
            encodedUrl,
            size: obj.Size!,
            lastModified: obj.LastModified!,
            etag: obj.ETag!,
            contentType: headResult.ContentType,
            metadata: headResult.Metadata,
          };
        })
      );

      return {
        files,
        truncated: result.IsTruncated || false,
        nextToken: result.NextContinuationToken,
      };
    } catch (error) {
      console.error('S3 list files error:', error);
      throw new Error(`Failed to list files: ${error}`);
    }
  }

  /**
   * Copy file within S3 (accepts encoded URLs)
   */
  async copyFile(
    sourceEncodedUrl: string,
    destBucket: string,
    destKey: string
  ): Promise<{ etag: string; encodedUrl: string }> {
    try {
      const { bucket: sourceBucket, key: sourceKey, contentType } = this.decodeMediaUrl(sourceEncodedUrl);

      const command = new CopyObjectCommand({
        CopySource: `${sourceBucket}/${sourceKey}`,
        Bucket: destBucket,
        Key: destKey,
      });

      const result = await s3Client.send(command);
      const encodedUrl = this.encodeMediaUrl(destBucket, destKey, contentType);

      return { 
        etag: result.CopyObjectResult!.ETag!,
        encodedUrl
      };
    } catch (error) {
      console.error('S3 copy file error:', error);
      throw new Error(`Failed to copy file: ${error}`);
    }
  }

  /**
   * Upload video/image optimized for streaming with encoded response
   */
  async uploadStreamingMedia(
    uploadData: StreamUploadData,
    mediaCategory: 'exercise' | 'patient' | 'educational' = 'exercise',
    entityId?: string
  ): Promise<EncodedMediaResponse> {
    try {
      // Generate unique key for the media file
      const timestamp = Date.now();
      const fileExtension = this.getFileExtension(uploadData.contentType);
      const mediaId = `${mediaCategory}_${entityId || 'general'}_${timestamp}`;
      const key = `streaming-media/${mediaCategory}/${entityId || 'general'}/${mediaId}${fileExtension}`;

      // Set streaming-optimized metadata
      const streamingMetadata = {
        ...uploadData.metadata,
        mediaId,
        category: mediaCategory,
        entityId: entityId || '',
        uploadedAt: new Date().toISOString(),
        streamingEnabled: 'true',
        cacheControl: 'max-age=31536000', // 1 year cache
      };

      // Set streaming-optimized tags
      const streamingTags = {
        ...uploadData.tags,
        Type: 'StreamingMedia',
        Category: mediaCategory,
        MediaId: mediaId,
        StreamingEnabled: 'true',
      };

      // Upload with streaming configuration
      const command = new PutObjectCommand({
        Bucket: uploadData.bucket,
        Key: key,
        Body: uploadData.body,
        ContentType: uploadData.contentType,
        Metadata: streamingMetadata,
        Tagging: streamingTags ? Object.entries(streamingTags)
          .map(([tagKey, value]) => `${tagKey}=${value}`)
          .join('&') : undefined,
        CacheControl: 'max-age=31536000',
        ACL: 'private', // Always private for security
      });

      const result = await s3Client.send(command);

      // Get file size for response
      const metadata = await this.getFileMetadataInternal(uploadData.bucket, key);

      // Generate encoded stream URL instead of direct S3 URL
      const encodedUrl = this.encodeMediaUrl(uploadData.bucket, key, uploadData.contentType);

      return {
        mediaId,
        fileName: key.split('/').pop() || mediaId,
        contentType: uploadData.contentType,
        size: metadata.size,
        uploadedAt: streamingMetadata.uploadedAt,
        encodedUrl,
      };
    } catch (error) {
      console.error('S3 streaming media upload error:', error);
      throw new Error(`Failed to upload streaming media: ${error}`);
    }
  }

  /**
   * Get streaming media data for video player (returns stream, not URL)
   */
  async getStreamingMedia(
    encodedUrl: string,
    range?: string
  ): Promise<{
    stream: Readable;
    contentType: string;
    contentLength: number;
    acceptRanges: boolean;
    contentRange?: string;
    totalSize: number;
  }> {
    try {
      // Decode the URL to get S3 info
      const { bucket, key, contentType } = this.decodeMediaUrl(encodedUrl);

      // Get file metadata first to support range requests
      const metadata = await this.getFileMetadataInternal(bucket, key);
      const totalSize = metadata.size;

      let rangeHeader: string | undefined;
      let start = 0;
      let end = totalSize - 1;
      let contentLength = totalSize;

      // Parse range header for video streaming
      if (range) {
        const ranges = range.replace(/bytes=/, '').split('-');
        start = parseInt(ranges[0], 10) || 0;
        end = parseInt(ranges[1], 10) || totalSize - 1;
        contentLength = end - start + 1;
        rangeHeader = `bytes=${start}-${end}`;
      }

      // Get object with range support
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        Range: rangeHeader,
      });

      const result = await s3Client.send(command);

      return {
        stream: result.Body as Readable,
        contentType,
        contentLength,
        acceptRanges: true,
        contentRange: range ? `bytes ${start}-${end}/${totalSize}` : undefined,
        totalSize,
      };
    } catch (error) {
      console.error('S3 get streaming media error:', error);
      throw new Error(`Failed to get streaming media: ${error}`);
    }
  }

  /**
   * Internal method to get file metadata using bucket and key directly
   */
  private async getFileMetadataInternal(bucket: string, key: string): Promise<FileMetadata> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const result = await s3Client.send(command);
      const encodedUrl = this.encodeMediaUrl(bucket, key, result.ContentType || 'application/octet-stream');

      return {
        key,
        encodedUrl,
        size: result.ContentLength!,
        lastModified: result.LastModified!,
        etag: result.ETag!,
        contentType: result.ContentType,
        metadata: result.Metadata,
      };
    } catch (error) {
      console.error('S3 get metadata error:', error);
      throw new Error(`Failed to get file metadata: ${error}`);
    }
  }

  /**
   * Upload patient document (updated to return encoded URL)
   */
  async uploadPatientDocument(
    patientId: string,
    documentType: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<{
    bucket: string;
    key: string;
    etag: string;
    encodedUrl: string;
  }> {
    const key = `patients/${patientId}/documents/${documentType}/${fileName}`;
    
    return this.uploadFile({
      bucket: this.defaultBucket,
      key,
      body: fileBuffer,
      contentType,
      metadata: {
        patientId,
        documentType,
        uploadedAt: new Date().toISOString(),
      },
      tags: {
        Type: 'PatientDocument',
        PatientId: patientId,
        DocumentType: documentType,
      },
      acl: 'private',
    });
  }

  /**
   * Upload medical image (updated to return encoded URL)
   */
  async uploadMedicalImage(
    patientId: string,
    studyType: string,
    fileName: string,
    imageBuffer: Buffer,
    contentType: string
  ): Promise<{
    bucket: string;
    key: string;
    etag: string;
    encodedUrl: string;
  }> {
    const key = `patients/${patientId}/images/${studyType}/${fileName}`;
    
    return this.uploadFile({
      bucket: this.defaultBucket,
      key,
      body: imageBuffer,
      contentType,
      metadata: {
        patientId,
        studyType,
        uploadedAt: new Date().toISOString(),
      },
      tags: {
        Type: 'MedicalImage',
        PatientId: patientId,
        StudyType: studyType,
      },
      acl: 'private',
    });
  }

  /**
   * Upload exercise video (updated to return encoded URL)
   */
  async uploadExerciseVideo(
    exerciseId: string,
    fileName: string,
    videoBuffer: Buffer
  ): Promise<{
    bucket: string;
    key: string;
    etag: string;
    encodedUrl: string;
  }> {
    const key = `exercises/${exerciseId}/videos/${fileName}`;
    
    return this.uploadFile({
      bucket: this.defaultBucket,
      key,
      body: videoBuffer,
      contentType: 'video/mp4',
      metadata: {
        exerciseId,
        uploadedAt: new Date().toISOString(),
      },
      tags: {
        Type: 'ExerciseVideo',
        ExerciseId: exerciseId,
      },
      acl: 'private', // Changed to private for security
    });
  }

  /**
   * Upload exercise video with streaming support
   */
  async uploadExerciseVideoStreaming(
    exerciseId: string,
    fileName: string,
    videoBuffer: Buffer,
    contentType: string = 'video/mp4'
  ): Promise<EncodedMediaResponse> {
    return this.uploadStreamingMedia({
      bucket: this.defaultBucket,
      key: '', // Will be generated in uploadStreamingMedia
      body: videoBuffer,
      contentType,
      metadata: {
        exerciseId,
        originalFileName: fileName,
      },
      tags: {
        ExerciseId: exerciseId,
      },
      enableStreaming: true,
    }, 'exercise', exerciseId);
  }

  /**
   * Upload patient medical image with streaming support
   */
  async uploadPatientImageStreaming(
    patientId: string,
    imageType: string,
    fileName: string,
    imageBuffer: Buffer,
    contentType: string
  ): Promise<EncodedMediaResponse> {
    return this.uploadStreamingMedia({
      bucket: this.defaultBucket,
      key: '', // Will be generated in uploadStreamingMedia
      body: imageBuffer,
      contentType,
      metadata: {
        patientId,
        imageType,
        originalFileName: fileName,
      },
      tags: {
        PatientId: patientId,
        ImageType: imageType,
      },
      enableStreaming: true,
    }, 'patient', patientId);
  }

  /**
   * Upload educational content with streaming support
   */
  async uploadEducationalContentStreaming(
    contentId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<EncodedMediaResponse> {
    return this.uploadStreamingMedia({
      bucket: this.defaultBucket,
      key: '', // Will be generated in uploadStreamingMedia
      body: fileBuffer,
      contentType,
      metadata: {
        contentId,
        originalFileName: fileName,
      },
      tags: {
        ContentId: contentId,
      },
      enableStreaming: true,
    }, 'educational', contentId);
  }

  /**
   * Get patient documents (returns encoded URLs)
   */
  async getPatientDocuments(patientId: string): Promise<FileMetadata[]> {
    const prefix = `patients/${patientId}/documents/`;
    const { files } = await this.listFiles(this.defaultBucket, prefix);
    return files;
  }

  /**
   * Get medical images for patient (returns encoded URLs)
   */
  async getPatientMedicalImages(patientId: string): Promise<FileMetadata[]> {
    const prefix = `patients/${patientId}/images/`;
    const { files } = await this.listFiles(this.defaultBucket, prefix);
    return files;
  }

  /**
   * Delete patient file (accepts encoded URL)
   */
  async deletePatientFile(patientId: string, encodedUrl: string): Promise<void> {
    try {
      const { key } = this.decodeMediaUrl(encodedUrl);
      
      // Verify the file belongs to the patient
      if (!key.startsWith(`patients/${patientId}/`)) {
        throw new Error('Unauthorized: File does not belong to the specified patient');
      }

      await this.deleteFile(encodedUrl);
    } catch (error) {
      console.error('Delete patient file error:', error);
      throw new Error(`Failed to delete patient file: ${error}`);
    }
  }

  /**
   * Create backup of patient data (returns encoded URL)
   */
  async backupPatientData(
    patientId: string,
    backupData: any
  ): Promise<{
    bucket: string;
    key: string;
    etag: string;
    encodedUrl: string;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `backups/patients/${patientId}/backup-${timestamp}.json`;
    
    return this.uploadFile({
      bucket: this.defaultBucket,
      key,
      body: JSON.stringify(backupData, null, 2),
      contentType: 'application/json',
      metadata: {
        patientId,
        backupType: 'patient-data',
        createdAt: new Date().toISOString(),
      },
      tags: {
        Type: 'Backup',
        PatientId: patientId,
      },
      acl: 'private',
    });
  }

  /**
   * Get media info by encoded URL (without streaming the file)
   */
  async getMediaInfo(encodedUrl: string): Promise<{
    mediaId: string;
    contentType: string;
    size: number;
    uploadedAt: string;
    category: string;
  }> {
    try {
      const { contentType } = this.decodeMediaUrl(encodedUrl);
      const metadata = await this.getFileMetadata(encodedUrl);

      return {
        mediaId: metadata.metadata?.mediaId || 'unknown',
        contentType,
        size: metadata.size,
        uploadedAt: metadata.metadata?.uploadedAt || metadata.lastModified.toISOString(),
        category: metadata.metadata?.category || 'unknown',
      };
    } catch (error) {
      console.error('S3 get media info error:', error);
      throw new Error(`Failed to get media info: ${error}`);
    }
  }
}

export const s3Service = new S3Service();
