function notFound(req, res, next) {
  res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  // Mongoose duplicate key error
  if (err && err.code === 11000) {
    return res.status(409).json({
      message: "Duplicate key error",
      details: err.keyValue,
    });
  }

  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    message: err.message || "Server error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}

module.exports = { notFound, errorHandler };
