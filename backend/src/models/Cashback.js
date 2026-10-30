const mongoose = require("mongoose");

const CashbackSchema = new mongoose.Schema(
  {
    cashbackId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    couponId: {
      type: Number,
      required: true,
      index: true,
    },
    couponRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerWallet: {
      type: String,
      required: true,
      lowercase: true,
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
    },
    amountWei: {
      type: String,
      required: true,
    },
    amountEth: {
      type: Number,
      required: true,
    },
    amountUSD: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "processed",
      index: true,
    },
    blockchainTxHash: {
      type: String,
      required: true,
      unique: true,
    },
    blockNumber: {
      type: Number,
    },
    gasUsed: {
      type: String,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cashback", CashbackSchema);
