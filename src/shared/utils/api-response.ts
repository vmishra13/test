/**
 * Standardized API response structure
 */
interface ApiResponseStructure<T = any> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp: string;
  apiVersion: string;
}

/**
 * Creates a standardized success response
 * @param data The payload to include in the response
 * @param message A user-friendly message describing the result
 * @returns A formatted success response object
 */
function createSuccessResponse<T = any>(
  data: T,
  message: string = 'Success',
): ApiResponseStructure<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    apiVersion: 'v1',
  };
}

/**
 * Creates a standardized error response
 * @param message Error message describing what went wrong
 * @param code A machine-readable error code
 * @param details Optional additional error details
 * @returns A formatted error response object
 */
function createErrorResponse(
  message: string,
  code: string = 'ERROR',
  details?: any,
): ApiResponseStructure<null> {
  const response: ApiResponseStructure<null> = {
    success: false,
    message,
    code,
    data: null,
    timestamp: new Date().toISOString(),
    apiVersion: 'v1',
  };

  // Add details if provided
  if (details) {
    response.details = details;
  }

  return response;
}

/**
 * Legacy compatibility object (optional - for gradual migration)
 * Maintains the same API as the original class
 */
export const ApiResponse = {
  success: createSuccessResponse,
  error: createErrorResponse,
};
