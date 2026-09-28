import { validationErrorResponse } from '../utils/apiResponse.js';

/**
 * Validation middleware factory.
 * Takes a Zod schema and returns Express middleware that validates req.body.
 * 
 * Usage:
 *   router.post('/register', validate(registerSchema), authController.register);
 */
export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return validationErrorResponse(res, errors);
    }

    // Replace body with the parsed (and possibly transformed) data
    req.body = result.data;
    next();
  };
}
