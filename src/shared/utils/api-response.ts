// src/shared/utils/api-response.ts
/**
 * Standardized API response utility for consistent response formats
 */
export class ApiResponse {
  /**
   * Creates a standardized success response
   * @param data The payload to include in the response
   * @param message A user-friendly message describing the result
   * @returns A formatted success response object
   */
  static success(data: any, message = 'Success') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Creates a standardized error response
   * @param message Error message describing what went wrong
   * @param code A machine-readable error code
   * @param statusCode The HTTP status code (for documentation purposes)
   * @param details Optional additional error details
   * @returns A formatted error response object
   */
  static error(message: string, code = 'ERROR', statusCode = 500, details?: any) {
    const response = {
      success: false,
      message,
      code,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
    };

    // Add details if provided
    if (details) {
      return {
        ...response,
        details,
      };
    }

    return response;
  }
}
