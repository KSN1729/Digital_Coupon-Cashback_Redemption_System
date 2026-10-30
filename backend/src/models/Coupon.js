const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema(
  {
    couponId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    merchantWallet: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Coupon title is required"],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: [true, "Coupon promotional code is required"],
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
    },
    minimumPurchase: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
    },
    cashbackPercentage: {
      type: Number,
      default: 5,
    },
    cashbackAmountWei: {
      type: String,
      default: "0",
    },
    cashbackAmountEth: {
      type: Number,
      default: 0,
    },
    terms: {
      type: String,
      default: "Standard terms and conditions apply. Single use per customer.",
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    couponHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    onChainTxHash: {
      type: String,
      default: null,
    },
    blockNumber: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "claimed", "redeemed", "expired", "revoked"],
      default: "active",
      index: true,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    claimedByWallet: {
      type: String,
      lowercase: true,
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    claimTxHash: {
      type: String,
      default: null,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    redemptionTxHash: {
      type: String,
      default: null,
    },
    redeemedByWallet: {
      type: String,
      lowercase: true,
      default: null,
    },
    maxRedemptions: {
      type: Number,
      default: 1,
    },
    currentRedemptions: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80",
    },
    fraudAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

CouponSchema.index({ category: 1, status: 1 });
CouponSchema.index({ merchantWallet: 1, status: 1 });

module.exports = mongoose.model("Coupon", CouponSchema);
