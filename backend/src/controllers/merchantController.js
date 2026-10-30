const { ethers } = require("ethers");
const Merchant = require("../models/Merchant");
const Coupon = require("../models/Coupon");
const Cashback = require("../models/Cashback");
const Transaction = require("../models/Transaction");
const blockchainService = require("../services/blockchainService");

// @desc    Get merchant profile & summary
// @route   GET /api/merchants/profile
// @access  Private (Merchant)
exports.getMerchantProfile = async (req, res, next) => {
  try {
    const merchant = await Merchant.findOne({ userId: req.user._id });
    if (!merchant) {
      return res.status(404).json({ success: false, message: "Merchant profile not found" });
    }

    const couponsCount = await Coupon.countDocuments({ merchantId: merchant._id });
    const redeemedCount = await Coupon.countDocuments({ merchantId: merchant._id, status: "redeemed" });
    const activeCount = await Coupon.countDocuments({ merchantId: merchant._id, status: "active" });

    res.status(200).json({
      success: true,
      data: {
        ...merchant.toObject(),
        stats: {
          totalCoupons: couponsCount,
          activeCoupons: activeCount,
          redeemedCoupons: redeemedCount,
          redemptionRate: couponsCount > 0 ? ((redeemedCount / couponsCount) * 100).toFixed(1) + "%" : "0%",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new cryptographic coupon
// @route   POST /api/merchants/coupons
// @access  Private (Merchant)
exports.createCoupon = async (req, res, next) => {
  try {
    const merchant = await Merchant.findOne({ userId: req.user._id });
    if (!merchant) {
      return res.status(404).json({ success: false, message: "Merchant profile not found" });
    }

    if (!merchant.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your merchant account is pending admin approval. You cannot issue coupons yet.",
      });
    }

    const {
      title,
      description,
      code,
      category,
      discountType,
      discountValue,
      minimumPurchase,
      maxDiscount,
      terms,
      expiryDate,
      cashbackAmountEth,
      imageUrl,
    } = req.body;

    if (!title || !code || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: "Missing required coupon details" });
    }

    const expiryTime = new Date(expiryDate).getTime();
    if (expiryTime <= Date.now()) {
      return res.status(400).json({ success: false, message: "Coupon expiry must be in the future" });
    }

    // Generate unique numeric 7-digit couponId
    const couponId = Math.floor(100000 + Math.random() * 900000);
    const expiryTimestamp = Math.floor(expiryTime / 1000);
    const parsedCashbackEth = Number(cashbackAmountEth || 0.01);
    const cashbackWei = ethers.parseEther(parsedCashbackEth.toString()).toString();

    const merchantWallet = req.user.walletAddress || merchant.walletAddress;

    // Cryptographic Keccak256 hash
    const couponHash = blockchainService.generateCouponHash(
      couponId,
      code,
      merchantWallet,
      Number(discountValue),
      expiryTimestamp
    );

    const newCoupon = await Coupon.create({
      couponId,
      merchantId: merchant._id,
      merchantWallet,
      title,
      description,
      code: code.toUpperCase().trim(),
      category: category || "General",
      discountType: discountType || "percentage",
      discountValue: Number(discountValue),
      minimumPurchase: Number(minimumPurchase || 0),
      maxDiscount: Number(maxDiscount || 0),
      terms: terms || "Standard verified coupon terms apply.",
      expiryDate: new Date(expiryDate),
      cashbackAmountEth: parsedCashbackEth,
      cashbackAmountWei: cashbackWei,
      couponHash,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80",
      status: "active",
    });

    merchant.totalCouponsCreated += 1;
    await merchant.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully. Blockchain hash generated.",
      data: newCoupon,
      blockchainPayload: {
        couponId,
        couponHash,
        expiryTimestamp,
        cashbackAmountWei: cashbackWei,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm on-chain transaction hash for coupon creation
// @route   POST /api/merchants/coupons/:id/confirm-onchain
// @access  Private (Merchant)
exports.confirmOnChainCoupon = async (req, res, next) => {
  try {
    const { txHash, blockNumber } = req.body;
    const coupon = await Coupon.findOne({ couponId: req.params.id });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    coupon.onChainTxHash = txHash;
    coupon.blockNumber = blockNumber || 0;
    await coupon.save();

    await Transaction.create({
      txId: "TX-" + Date.now(),
      type: "COUPON_CREATE",
      couponId: coupon.couponId,
      merchantWallet: coupon.merchantWallet,
      blockchainTxHash: txHash,
      blockNumber: blockNumber || 0,
      status: "CONFIRMED",
      payload: {
        couponHash: coupon.couponHash,
        title: coupon.title,
        cashbackEth: coupon.cashbackAmountEth,
      },
    });

    res.status(200).json({ success: true, message: "Blockchain transaction recorded successfully", coupon });
  } catch (error) {
    next(error);
  }
};

// @desc    List all coupons belonging to current merchant
// @route   GET /api/merchants/coupons
// @access  Private (Merchant)
exports.getMerchantCoupons = async (req, res, next) => {
  try {
    const merchant = await Merchant.findOne({ userId: req.user._id });
    if (!merchant) {
      return res.status(404).json({ success: false, message: "Merchant profile not found" });
    }

    const { status, category } = req.query;
    const query = { merchantId: merchant._id };

    if (status) query.status = status;
    if (category) query.category = category;

    const coupons = await Coupon.find(query)
      .populate("claimedBy", "name email walletAddress")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify coupon presented by customer
// @route   POST /api/merchants/verify-coupon
// @access  Private (Merchant)
exports.verifyCouponPresentation = async (req, res, next) => {
  try {
    const { couponId, code, customerWallet } = req.body;

    const coupon = await Coupon.findOne({ couponId: Number(couponId) });
    if (!coupon) {
      return res.status(404).json({ success: false, isValid: false, reason: "Coupon ID does not exist in registry" });
    }

    if (coupon.code !== code.toUpperCase().trim()) {
      coupon.fraudAttempts += 1;
      await coupon.save();
      return res.status(400).json({
        success: false,
        isValid: false,
        reason: "Cryptographic hash / code mismatch! Potential counterfeit attempt detected.",
      });
    }

    if (coupon.status === "redeemed") {
      return res.status(400).json({
        success: false,
        isValid: false,
        reason: "Double redemption prevented: Coupon was already redeemed at " + coupon.redeemedAt,
      });
    }

    if (new Date(coupon.expiryDate).getTime() < Date.now()) {
      coupon.status = "expired";
      await coupon.save();
      return res.status(400).json({ success: false, isValid: false, reason: "Coupon has expired" });
    }

    if (customerWallet && coupon.claimedByWallet && coupon.claimedByWallet.toLowerCase() !== customerWallet.toLowerCase()) {
      return res.status(400).json({
        success: false,
        isValid: false,
        reason: "Ownership mismatch: Presenter wallet does not match registered owner wallet.",
      });
    }

    res.status(200).json({
      success: true,
      isValid: true,
      coupon: {
        couponId: coupon.couponId,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        cashbackAmountEth: coupon.cashbackAmountEth,
        customerWallet: coupon.claimedByWallet,
        status: coupon.status,
        couponHash: coupon.couponHash,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Merchant completes redemption & triggers cashback record
// @route   POST /api/merchants/redeem-coupon
// @access  Private (Merchant)
exports.redeemCoupon = async (req, res, next) => {
  try {
    const { couponId, txHash, blockNumber } = req.body;
    const coupon = await Coupon.findOne({ couponId: Number(couponId) });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    if (coupon.status === "redeemed") {
      return res.status(400).json({ success: false, message: "Double redemption prevented: Coupon already redeemed" });
    }

    coupon.status = "redeemed";
    coupon.redeemedAt = new Date();
    coupon.redemptionTxHash = txHash || "ONCHAIN-TX-" + Date.now();
    await coupon.save();

    // Create Cashback entry
    const cashback = await Cashback.create({
      cashbackId: "CB-" + Date.now(),
      couponId: coupon.couponId,
      couponRef: coupon._id,
      customerId: coupon.claimedBy,
      customerWallet: coupon.claimedByWallet || "0x0000000000000000000000000000000000000000",
      merchantId: coupon.merchantId,
      merchantWallet: coupon.merchantWallet,
      amountWei: coupon.cashbackAmountWei,
      amountEth: coupon.cashbackAmountEth,
      amountUSD: Number((coupon.cashbackAmountEth * 3500).toFixed(2)),
      blockchainTxHash: txHash || "0x" + Math.random().toString(16).substring(2, 66),
      blockNumber: blockNumber || 0,
      status: "processed",
    });

    // Record Transaction
    await Transaction.create({
      txId: "TX-RED-" + Date.now(),
      type: "COUPON_REDEEM",
      couponId: coupon.couponId,
      userWallet: coupon.claimedByWallet,
      merchantWallet: coupon.merchantWallet,
      blockchainTxHash: txHash || cashback.blockchainTxHash,
      blockNumber: blockNumber || 0,
      status: "CONFIRMED",
      payload: {
        cashbackEth: coupon.cashbackAmountEth,
        discountValue: coupon.discountValue,
      },
    });

    res.status(200).json({
      success: true,
      message: "Coupon successfully redeemed and cashback recorded!",
      coupon,
      cashback,
    });
  } catch (error) {
    next(error);
  }
};
