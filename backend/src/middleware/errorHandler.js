const errorHandler = (err, req, res, next) => {
  console.error("[API Error Handler]", err.stack || err.message);

  let error = { ...err };
  error.message = err.message;

  // Mongoose Bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found with specified ID: ${err.value}`;
    return res.status(404).json({ success: false, message });
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value entered for field: ${field}. Please use another unique value.`;
    return res.status(400).json({ success: false, message });
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ success: false, message: message.join(", ") });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
