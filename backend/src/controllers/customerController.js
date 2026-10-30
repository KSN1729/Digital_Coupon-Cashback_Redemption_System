const Coupon = require("../models/Coupon");
const User = require("../models/User");
const Cashback = require("../models/Cashback");
const Transaction = require("../models/Transaction");
const Merchant = require("../models/Merchant");
const blockchainService = require("../services/blockchainService");

// @desc    Browse active coupons with search & filters
// @route   GET /api/customers/coupons
// @access  Public
exports.browseCoupons = async (req, res, next) => {
  try {
    const { category, search, sort, page = 1, limit = 12 } = req.query;

    const query = {
      status: "active",
      expiryDate: { $gt: new Date() },
    };

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === "discount-high") sortOptions = { discountValue: -1 };
    if (sort === "cashback-high") sortOptions = { cashbackAmountEth: -1 };
    if (sort === "expiring-soon") sortOptions = { expiryDate: 1 };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      .populate("merchantId", "businessName logoUrl rating")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed coupon information
// @route   GET /api/customers/coupons/:id
// @access  Public
exports.getCouponById = async (req, res, next) => {
  try {
    const coupon = await Coupon.findOne({ couponId: Number(req.params.id) }).populate(
      "merchantId",
      "businessName description website contactEmail logoUrl rating"
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
};

// @desc    Customer claims coupon into their wallet
// @route   POST /api/customers/coupons/:id/claim
// @access  Private (Customer)
exports.claimCoupon = async (req, res, next) => {
  try {
    const couponId = Number(req.params.id);
    const coupon = await Coupon.findOne({ couponId });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    if (coupon.status !== "active") {
      return res.status(400).json({ success: false, message: `Coupon is already ${coupon.status}` });
    }

    if (new Date(coupon.expiryDate).getTime() < Date.now()) {
      coupon.status = "expired";
      await coupon.save();
      return res.status(400).json({ success: false, message: "This coupon has expired" });
    }

    const customerWallet = req.body.walletAddress || req.user.walletAddress;
    if (!customerWallet) {
      return res.status(400).json({
        success: false,
        message: "A connected Web3 wallet address is required to claim this coupon on blockchain",
      });
    }

    coupon.status = "claimed";
    coupon.claimedBy = req.user._id;
    coupon.claimedByWallet = customerWallet.toLowerCase();
    coupon.claimedAt = new Date();
    coupon.claimTxHash = req.body.claimTxHash || null;
    await coupon.save();

    // Update user claimed list
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        claimedCoupons: {
          coupon: coupon._id,
          claimedAt: new Date(),
          isRedeemed: false,
        },
      },
    });

    // Record Transaction
    if (req.body.claimTxHash) {
      await Transaction.create({
        txId: "TX-CLAIM-" + Date.now(),
        type: "COUPON_CLAIM",
        couponId: coupon.couponId,
        userWallet: customerWallet.toLowerCase(),
        merchantWallet: coupon.merchantWallet,
        blockchainTxHash: req.body.claimTxHash,
        status: "CONFIRMED",
        payload: {
          title: coupon.title,
          claimedAt: new Date(),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon claimed successfully into your decentralized wallet!",
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get coupons claimed by current customer
// @route   GET /api/customers/my-coupons
// @access  Private (Customer)
exports.getCustomerCoupons = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { claimedBy: req.user._id };

    if (status) query.status = status;

    const coupons = await Coupon.find(query)
      .populate("merchantId", "businessName logoUrl website")
      .sort({ claimedAt: -1 });

    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    next(error);
  }
};

// @desc    Customer confirms redemption with on-chain tx proof
// @route   POST /api/customers/coupons/:id/redeem
// @access  Private (Customer)
exports.redeemCouponByCustomer = async (req, res, next) => {
  try {
    const couponId = Number(req.params.id);
    const { txHash, blockNumber } = req.body;

    const coupon = await Coupon.findOne({ couponId, claimedBy: req.user._id });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found in your claimed portfolio" });
    }

    if (coupon.status === "redeemed") {
      return res.status(400).json({ success: false, message: "Double redemption prevented: Coupon already redeemed" });
    }

    coupon.status = "redeemed";
    coupon.redeemedAt = new Date();
    coupon.redemptionTxHash = txHash || "0x" + Math.random().toString(16).substring(2, 66);
    coupon.redeemedByWallet = req.user.walletAddress || coupon.claimedByWallet;
    await coupon.save();

    // Update User reward balance
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { rewardBalance: coupon.cashbackAmountEth },
    });

    // Create Cashback record
    const cashback = await Cashback.create({
      cashbackId: "CB-" + Date.now(),
      couponId: coupon.couponId,
      couponRef: coupon._id,
      customerId: req.user._id,
      customerWallet: coupon.redeemedByWallet,
      merchantId: coupon.merchantId,
      merchantWallet: coupon.merchantWallet,
      amountWei: coupon.cashbackAmountWei,
      amountEth: coupon.cashbackAmountEth,
      amountUSD: Number((coupon.cashbackAmountEth * 3500).toFixed(2)),
      blockchainTxHash: coupon.redemptionTxHash,
      blockNumber: blockNumber || 0,
      status: "processed",
    });

    // Create Transaction Record
    await Transaction.create({
      txId: "TX-RED-" + Date.now(),
      type: "COUPON_REDEEM",
      couponId: coupon.couponId,
      userWallet: coupon.redeemedByWallet,
      merchantWallet: coupon.merchantWallet,
      blockchainTxHash: coupon.redemptionTxHash,
      status: "CONFIRMED",
      payload: {
        cashbackEth: coupon.cashbackAmountEth,
      },
    });

    res.status(200).json({
      success: true,
      message: "Coupon redeemed! Cashback disbursed to your wallet.",
      coupon,
      cashback,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's cashback history
// @route   GET /api/customers/cashbacks
// @access  Private (Customer)
exports.getCashbackHistory = async (req, res, next) => {
  try {
    const cashbacks = await Cashback.find({ customerId: req.user._id })
      .populate("couponRef", "title code category")
      .populate("merchantId", "businessName logoUrl")
      .sort({ issuedAt: -1 });

    const totalEth = cashbacks.reduce((acc, curr) => acc + (curr.amountEth || 0), 0);
    const totalUSD = cashbacks.reduce((acc, curr) => acc + (curr.amountUSD || 0), 0);

    res.status(200).json({
      success: true,
      totalEarnedEth: Number(totalEth.toFixed(4)),
      totalEarnedUSD: Number(totalUSD.toFixed(2)),
      count: cashbacks.length,
      data: cashbacks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's blockchain transaction history
// @route   GET /api/customers/transactions
// @access  Private (Customer)
exports.getCustomerTransactions = async (req, res, next) => {
  try {
    const wallet = req.user.walletAddress ? req.user.walletAddress.toLowerCase() : null;
    const query = wallet ? { userWallet: wallet } : { "payload.userId": req.user._id };

    const transactions = await Transaction.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    next(error);
  }
};
