const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userRole: {
      type: String,
      default: "anonymous",
    },
    walletAddress: {
      type: String,
      lowercase: true,
      default: null,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILURE", "WARNING", "BLOCKED"],
      default: "SUCCESS",
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1",
    },
    userAgent: {
      type: String,
      default: "",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false },
  }
);

AuditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
