/**
 * Standardized API response helpers.
 * Every endpoint uses these so the frontend always gets a consistent shape.
 */

export function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function errorResponse(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

export function validationErrorResponse(res, errors) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
}
