const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate Limiter to prevent DoS / brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP address, please try again after 15 minutes.",
  },
});
app.use("/api", limiter);

// Body Parsers & Logger
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Root Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    project: "Blockchain-Based Digital Coupon & Cashback Redemption System",
    status: "HEALTHY",
    version: "1.0.0",
    blockchain: "Ethereum / Solidity 0.8.24",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/merchants", require("./routes/merchantRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

// 404 Route Handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`,
  });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Decentralized Coupon & Cashback Server Running    `);
  console.log(`  Port: ${PORT} | Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`  Local URL: http://localhost:${PORT}             `);
  console.log(`====================================================`);
});

module.exports = app;
