export function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message, err.stack);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  }

  // Multer file type error (thrown manually)
  if (err.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ error: 'Invalid file type. Only images and PDFs are allowed.' });
  }

  const status = err.status || 500;
  const message = err.expose ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
}
