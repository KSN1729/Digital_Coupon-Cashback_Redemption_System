const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    txId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["COUPON_CREATE", "COUPON_CLAIM", "COUPON_REDEEM", "CASHBACK_PAYMENT", "COUPON_REVOKE"],
      required: true,
      index: true,
    },
    couponId: {
      type: Number,
      required: true,
      index: true,
    },
    userWallet: {
      type: String,
      lowercase: true,
      trim: true,
    },
    merchantWallet: {
      type: String,
      lowercase: true,
      trim: true,
    },
    blockchainTxHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    blockNumber: {
      type: Number,
    },
    gasUsed: {
      type: String,
    },
    effectiveGasPrice: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "FAILED"],
      default: "CONFIRMED",
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
