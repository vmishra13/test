import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiResponse } from '@/shared/utils/api-response';
import { authenticate } from '@/features/auth/middlewares/auth.middleware';
import { sesService } from '@/services/aws/services/ses.service';

const router = Router();

/**
 * POST /email/send
 * Send a simple email
 */
router.post('/send', authenticate, async (req, res) => {
  try {
    const { to, cc, bcc, subject, htmlBody, textBody, from, replyTo } = req.body;

    // Validation
    if (!to || !Array.isArray(to) || to.length === 0) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Recipients (to) are required and must be an array')
      );
      return;
    }

    if (!subject) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Subject is required')
      );
      return;
    }

    if (!htmlBody && !textBody) {
      res.status(StatusCodes.BAD_REQUEST).json(
        ApiResponse.error('Either htmlBody or textBody is required')
      );
      return;
    }

    const result = await sesService.sendEmail({
      to,
      cc,
      bcc,
      subject,
      htmlBody,
      textBody,
      from,
      replyTo
    });

    res.status(StatusCodes.OK).json(
      ApiResponse.success(result, 'Email sent successfully')
    );
  } catch (error) {
    console.error('Send email error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      ApiResponse.error('Failed to send email')
    );
  }
});

export default router;