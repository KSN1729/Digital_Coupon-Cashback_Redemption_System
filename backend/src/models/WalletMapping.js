const mongoose = require("mongoose");

const WalletMappingSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "merchant", "admin"],
      required: true,
    },
    nonce: {
      type: String,
      required: true,
      default: () => "NONCE-" + Math.floor(Math.random() * 1000000).toString(),
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    lastSignature: {
      type: String,
      default: null,
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WalletMapping", WalletMappingSchema);
