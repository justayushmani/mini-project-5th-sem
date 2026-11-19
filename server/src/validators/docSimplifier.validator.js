/**
 * Validates request parameters for document simplification.
 */
export function validateDocSimplifierBody(req, res, next) {
  const { consent, language } = req.body;

  const isConsentGiven = consent === true || consent === 'true';
  if (!isConsentGiven) {
    const error = new Error('User consent is required to process the document.');
    error.statusCode = 400;
    return next(error);
  }

  if (language && !['en', 'hi', 'bn'].includes(language)) {
    const error = new Error('Invalid language. Supported values are "en", "hi", and "bn".');
    error.statusCode = 400;
    return next(error);
  }

  req.body.language = (language === 'hi' || language === 'bn') ? language : 'en';
  next();
}

export default validateDocSimplifierBody;
