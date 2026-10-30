const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    adminLevel: {
      type: String,
      enum: ["SUPER_ADMIN", "COMPLIANCE_OFFICER", "SUPPORT"],
      default: "SUPER_ADMIN",
    },
    permissions: [
      {
        type: String,
      },
    ],
    cashbackPlatformRatePercent: {
      type: Number,
      default: 5.0,
    },
    isEmergencyPaused: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", AdminSchema);
