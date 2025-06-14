import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import { s3Service } from '@/aws/services/s3.service';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow videos and images
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and image files are allowed'));
    }
  },
});

/**
 * POST /media/upload/exercise-video
 * Upload exercise video with streaming support
 */
router.post('/upload/exercise-video', authenticate, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Video file is required')
      );
      return;
    }

    const { exerciseId } = req.body;
    if (!exerciseId) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Exercise ID is required')
      );
      return;
    }

    const result = await s3Service.uploadExerciseVideoStreaming(
      exerciseId,
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype
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
 * Upload patient medical image with streaming support
 */
router.post('/upload/patient-image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Image file is required')
      );
      return;
    }

    const { patientId, imageType } = req.body;
    if (!patientId || !imageType) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Patient ID and image type are required')
      );
      return;
    }

    const result = await s3Service.uploadPatientImageStreaming(
      patientId,
      imageType,
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype
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

/**
 * GET /media/stream/:encodedUrl
 * Stream media file (video/image) with range support
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

export default router;