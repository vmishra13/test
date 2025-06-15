import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import { s3Service } from '@/aws/services/s3.service';
import { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// File type configurations
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff'
};

const ALLOWED_VIDEO_TYPES = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogg',
  'video/avi': 'avi',
  'video/mov': 'mov',
  'video/wmv': 'wmv',
  'video/flv': 'flv',
  'video/3gpp': '3gp',
  'video/quicktime': 'mov'
};

const ALLOWED_DOCUMENT_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt'
};

const ALL_ALLOWED_TYPES = { ...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES };

/**
 * Validate file type and size
 */
function validateFile(file: UploadedFile, allowedTypes: Record<string, string>, maxSize: number): string | null {
  if (!allowedTypes[file.mimetype]) {
    return `Invalid file type. Allowed types: ${Object.keys(allowedTypes).join(', ')}`;
  }

  if (file.size > maxSize) {
    return `File size too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`;
  }

  return null;
}

// ===== AWS S3 ENDPOINTS (for large files, streaming) =====

/**
 * POST /media/upload/exercise-video
 * Upload exercise video to S3 with streaming support
 */
router.post('/upload/exercise-video', authenticate, async (req, res) => {
  try {
    if (!req.files || !req.files.video) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Video file is required')
      );
      return;
    }

    const videoFile = req.files.video as UploadedFile;
    const { exerciseId } = req.body;

    if (!exerciseId) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Exercise ID is required')
      );
      return;
    }

    // Validate video file (100MB max for exercise videos)
    const validationError = validateFile(videoFile, ALLOWED_VIDEO_TYPES, 100 * 1024 * 1024);
    if (validationError) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error(validationError)
      );
      return;
    }

    const result = await s3Service.uploadExerciseVideoStreaming(
      exerciseId,
      videoFile.name,
      videoFile.data,
      videoFile.mimetype
    );

    res.status(StatusCodes.CREATED).json(
      ApiResponse.success(result, 'Exercise video uploaded successfully')
    );
  } catch (error) {
    console.error('Upload exercise video error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to upload exercise video')
    );
  }
});

/**
 * POST /media/upload/patient-image
 * Upload patient medical image to S3 with streaming support
 */
router.post('/upload/patient-image', authenticate, async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Image file is required')
      );
      return;
    }

    const imageFile = req.files.image as UploadedFile;
    const { patientId, imageType } = req.body;

    if (!patientId || !imageType) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Patient ID and image type are required')
      );
      return;
    }

    // Validate image file (50MB max for medical images)
    const validationError = validateFile(imageFile, ALLOWED_IMAGE_TYPES, 50 * 1024 * 1024);
    if (validationError) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error(validationError)
      );
      return;
    }

    const result = await s3Service.uploadPatientImageStreaming(
      patientId,
      imageType,
      imageFile.name,
      imageFile.data,
      imageFile.mimetype
    );

    res.status(StatusCodes.CREATED).json(
      ApiResponse.success(result, 'Patient image uploaded successfully')
    );
  } catch (error) {
    console.error('Upload patient image error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to upload patient image')
    );
  }
});

// ===== LOCAL STORAGE ENDPOINTS (for smaller files) =====

/**
 * POST /media/upload
 * Upload a general file to local storage
 */
router.post('/upload', authenticate, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('No files were uploaded')
      );
      return;
    }

    const uploadedFile = req.files.file as UploadedFile;
    
    if (!uploadedFile) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('File field is required')
      );
      return;
    }

    // Validate file type
    if (!ALL_ALLOWED_TYPES[uploadedFile.mimetype as keyof typeof ALL_ALLOWED_TYPES]) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Invalid file type. Allowed types: images, videos, and documents')
      );
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (uploadedFile.size > maxSize) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('File size too large. Maximum size is 50MB')
      );
      return;
    }

    const user = (req as any).user;
    const fileExtension = ALL_ALLOWED_TYPES[uploadedFile.mimetype as keyof typeof ALL_ALLOWED_TYPES];
    const fileName = `${uuidv4()}.${fileExtension}`;
    const uploadDir = path.join(process.cwd(), 'uploads', user.clientId.toString());
    const filePath = path.join(uploadDir, fileName);

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Save the file
    await uploadedFile.mv(filePath);

    const fileData = {
      originalName: uploadedFile.name,
      fileName: fileName,
      filePath: `/uploads/${user.clientId}/${fileName}`,
      size: uploadedFile.size,
      mimeType: uploadedFile.mimetype,
      uploadedBy: user.id,
      clientId: user.clientId,
      uploadedAt: new Date().toISOString()
    };

    res.status(StatusCodes.OK).json(
      ApiResponse.success(fileData, 'File uploaded successfully')
    );
  } catch (error) {
    console.error('File upload error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('File upload failed')
    );
  }
});

/**
 * POST /media/upload/profile-picture
 * Upload profile picture (supports both S3 and local storage)
 */
router.post('/upload/profile-picture', authenticate, async (req, res) => {
  try {
    if (!req.files || !req.files.profilePicture) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Profile picture file is required')
      );
      return;
    }

    const imageFile = req.files.profilePicture as UploadedFile;
    const user = (req as any).user;

    // Validate image file (10MB max for profile pictures)
    const validationError = validateFile(imageFile, ALLOWED_IMAGE_TYPES, 10 * 1024 * 1024);
    if (validationError) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error(validationError)
      );
      return;
    }

    // Use S3 for profile pictures if available, otherwise local storage
    let result;
    try {
      result = await s3Service.uploadPatientImageStreaming(
        user.id,
        'profile',
        imageFile.name,
        imageFile.data,
        imageFile.mimetype
      );
    } catch (s3Error) {
      console.warn('S3 upload failed, falling back to local storage:', s3Error);
      
      // Fallback to local storage
      const fileExtension = ALLOWED_IMAGE_TYPES[imageFile.mimetype as keyof typeof ALLOWED_IMAGE_TYPES];
      const fileName = `profile_${user.id}_${Date.now()}.${fileExtension}`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'profiles', user.clientId.toString());
      const filePath = path.join(uploadDir, fileName);

      await fs.mkdir(uploadDir, { recursive: true });
      await imageFile.mv(filePath);

      result = {
        fileName: fileName,
        filePath: `/uploads/profiles/${user.clientId}/${fileName}`,
        size: imageFile.size,
        mimeType: imageFile.mimetype,
        uploadedBy: user.id,
        clientId: user.clientId,
        uploadedAt: new Date().toISOString()
      };
    }

    res.status(StatusCodes.CREATED).json(
      ApiResponse.success(result, 'Profile picture uploaded successfully')
    );
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to upload profile picture')
    );
  }
});

// ===== STREAMING & DOWNLOAD ENDPOINTS =====

/**
 * GET /media/stream/:encodedUrl
 * Stream media file (video/image) with range support from S3
 */
router.get('/stream/:encodedUrl', async (req, res) => {
  try {
    const { encodedUrl } = req.params;
    const range = req.headers.range;

    const mediaStream = await s3Service.getStreamingMedia(encodedUrl, range);

    // Set appropriate headers for streaming
    res.status(range ? StatusCodes.PARTIAL_CONTENT : StatusCodes.OK);
    res.setHeader('Content-Type', mediaStream.contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', mediaStream.contentLength);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache

    if (range && mediaStream.contentRange) {
      res.setHeader('Content-Range', mediaStream.contentRange);
    }

    // For videos, set additional headers to enable streaming
    if (mediaStream.contentType.startsWith('video/')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Range');
    }

    // Pipe the stream to response
    mediaStream.stream.pipe(res);

    // Handle stream errors
    mediaStream.stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
      }
    });

  } catch (error) {
    console.error('Stream media error:', error);
    if (!res.headersSent) {
      res.status(StatusCodes.NOT_FOUND).json(
        ApiResponse.error('Media not found or access denied')
      );
    }
  }
});

/**
 * GET /media/download/:clientId/:fileName
 * Download/serve a file from local storage
 */
router.get('/download/:clientId/:fileName', authenticate, async (req, res) => {
  try {
    const { clientId, fileName } = req.params;
    const user = (req as any).user;

    // Security check: users can only access files from their own client
    if (user.clientId !== Number(clientId)) {
      res.status(StatusCodes.FORBIDDEN).json(
        ApiResponse.error('Access denied to this file')
      );
      return;
    }

    const filePath = path.join(process.cwd(), 'uploads', clientId, fileName);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      res.status(StatusCodes.NOT_FOUND).json(
        ApiResponse.error('File not found')
      );
      return;
    }

    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('File download error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('File download failed')
    );
  }
});

// ===== MEDIA MANAGEMENT ENDPOINTS =====

/**
 * GET /media/info/:encodedUrl
 * Get media information without streaming
 */
router.get('/info/:encodedUrl', authenticate, async (req, res) => {
  try {
    const { encodedUrl } = req.params;
    const mediaInfo = await s3Service.getMediaInfo(encodedUrl);

    res.status(StatusCodes.OK).json(
      ApiResponse.success(mediaInfo, 'Media info retrieved successfully')
    );
  } catch (error) {
    console.error('Get media info error:', error);
    res.status(StatusCodes.NOT_FOUND).json(
      ApiResponse.error('Media not found or access denied')
    );
  }
});

/**
 * DELETE /media/:encodedUrl
 * Delete a media file from S3
 */
router.delete('/:encodedUrl', authenticate, async (req, res) => {
  try {
    const { encodedUrl } = req.params;
    const user = (req as any).user;

    // Note: deleteMedia method needs to be implemented in s3Service
    // For now, return a not implemented response
    res.status(StatusCodes.NOT_IMPLEMENTED).json(
      ApiResponse.error('Delete media functionality not implemented yet')
    );
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to delete media')
    );
  }
});

export default router;