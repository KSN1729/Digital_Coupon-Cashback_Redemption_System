const User = require("../models/User");
const Merchant = require("../models/Merchant");
const Coupon = require("../models/Coupon");
const Cashback = require("../models/Cashback");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const AuditLog = require("../models/AuditLog");
const Admin = require("../models/Admin");
const blockchainService = require("../services/blockchainService");

// @desc    Get system-wide overview statistics
// @route   GET /api/admin/overview
// @access  Private (Admin)
exports.getAdminOverview = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: "customer" });
    const totalMerchants = await Merchant.countDocuments();
    const pendingMerchants = await Merchant.countDocuments({ approvalStatus: "pending" });
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ status: "active" });
    const claimedCoupons = await Coupon.countDocuments({ status: "claimed" });
    const redeemedCoupons = await Coupon.countDocuments({ status: "redeemed" });
    const totalTransactions = await Transaction.countDocuments();
    const fraudAttemptsCount = await Coupon.aggregate([
      { $group: { _id: null, totalFraud: { $sum: "$fraudAttempts" } } },
    ]);

    const cashbacks = await Cashback.find({ status: "processed" });
    const totalCashbackEth = cashbacks.reduce((acc, c) => acc + (c.amountEth || 0), 0);
    const totalCashbackUSD = cashbacks.reduce((acc, c) => acc + (c.amountUSD || 0), 0);

    const latestBlock = await blockchainService.getLatestBlockNumber();

    res.status(200).json({
      success: true,
      stats: {
        users: { total: totalUsers },
        merchants: { total: totalMerchants, pending: pendingMerchants },
        coupons: {
          total: totalCoupons,
          active: activeCoupons,
          claimed: claimedCoupons,
          redeemed: redeemedCoupons,
        },
        cashback: {
          totalEth: Number(totalCashbackEth.toFixed(4)),
          totalUSD: Number(totalCashbackUSD.toFixed(2)),
          count: cashbacks.length,
        },
        blockchain: {
          totalTransactions,
          contractAddress: blockchainService.contractAddress,
          latestBlock,
          fraudAlerts: fraudAttemptsCount[0] ? fraudAttemptsCount[0].totalFraud : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List merchants for approval
// @route   GET /api/admin/merchants
// @access  Private (Admin)
exports.getMerchants = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { approvalStatus: status } : {};

    const merchants = await Merchant.find(query)
      .populate("userId", "name email walletAddress createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: merchants.length, data: merchants });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject merchant
// @route   PUT /api/admin/merchants/:id/status
// @access  Private (Admin)
exports.updateMerchantStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // "approved" | "rejected" | "suspended"
    const merchant = await Merchant.findById(req.params.id);

    if (!merchant) {
      return res.status(404).json({ success: false, message: "Merchant not found" });
    }

    merchant.approvalStatus = status;
    merchant.isApproved = status === "approved";
    if (status === "approved") {
      merchant.approvedAt = new Date();
      merchant.approvedBy = req.user._id;

      // In production with admin signer, call contract.setMerchantAuthorization(merchant.walletAddress, true)
    }

    await merchant.save();

    res.status(200).json({
      success: true,
      message: `Merchant status updated to ${status}`,
      merchant,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all system users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { walletAddress: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend or activate user
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // "active" | "suspended"
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status = status;
    await user.save();

    res.status(200).json({ success: true, message: `User status changed to ${status}`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Manage coupon categories
// @route   GET /api/admin/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/admin/categories
// @access  Private (Admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, icon, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    const category = await Category.create({
      name,
      slug,
      icon: icon || "Tag",
      description: description || "",
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all blockchain transactions
// @route   GET /api/admin/transactions
// @access  Private (Admin)
exports.getTransactions = async (req, res, next) => {
  try {
    const { type, limit = 50 } = req.query;
    const query = type ? { type } : {};

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get security audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { action, status, limit = 100 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (status) query.status = status;

    const logs = await AuditLog.find(query)
      .populate("userId", "name email")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};
