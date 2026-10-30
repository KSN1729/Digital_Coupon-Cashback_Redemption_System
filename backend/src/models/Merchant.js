const mongoose = require("mongoose");

const MerchantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, "Business registration number is required"],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Business category is required"],
    },
    description: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    walletAddress: {
      type: String,
      required: [true, "Merchant settlement wallet is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    totalCouponsCreated: {
      type: Number,
      default: 0,
    },
    totalRedemptions: {
      type: Number,
      default: 0,
    },
    totalCashbackDistributedWei: {
      type: String,
      default: "0",
    },
    fraudFlagCount: {
      type: Number,
      default: 0,
    },
    logoUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=200&q=80",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Merchant", MerchantSchema);
