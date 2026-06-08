export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Default status
  let statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Mongoose Invalid ObjectId
  if (err.name === "CastError") {
    statusCode = 400;

    err.message = "Invalid ID format";
  }

  // Mongo duplicate key error
  if (err.code === 11000) {
    statusCode = 400;

    err.message = "Duplicate field value";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;

    err.message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  res.status(statusCode).json({
    success: false,

    message: err.message || "Server Error",

    // Only show stack in development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
