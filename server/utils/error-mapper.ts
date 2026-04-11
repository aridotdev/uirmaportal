import { ErrorCode } from '#server/utils/error-codes'

export function mapGenericErrorToHttp(error: unknown) {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  if (code === ErrorCode.NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'Resource not found' }
  }
  if (code === ErrorCode.FORBIDDEN) {
    return { statusCode: 403, statusMessage: 'Forbidden' }
  }
  if (code === ErrorCode.UNAUTHORIZED) {
    return { statusCode: 401, statusMessage: 'Unauthorized' }
  }
  if (code === ErrorCode.VALIDATION_FAILED) {
    return { statusCode: 400, statusMessage: 'Validation failed' }
  }

  return { statusCode: 500, statusMessage: 'Internal server error' }
}
