const Coupon = require("../models/Coupon");
const Cashback = require("../models/Cashback");
const Transaction = require("../models/Transaction");
const Merchant = require("../models/Merchant");

// @desc    Get comprehensive analytics data for charts & dashboards
// @route   GET /api/analytics/dashboard
// @access  Public / Private
exports.getAnalyticsDashboard = async (req, res, next) => {
  try {
    // 1. Redemptions per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const redemptionsPerDay = await Coupon.aggregate([
      {
        $match: {
          status: "redeemed",
          redeemedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$redeemedAt" } },
          count: { $sum: 1 },
          cashbackEth: { $sum: "$cashbackAmountEth" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. Top Performing Coupons
    const topCoupons = await Coupon.find({ status: { $in: ["active", "claimed", "redeemed"] } })
      .select("couponId title discountValue discountType category cashbackAmountEth currentRedemptions")
      .sort({ currentRedemptions: -1, createdAt: -1 })
      .limit(5);

    // 3. Category distribution
    const categoryDistribution = await Coupon.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          redeemed: {
            $sum: { $cond: [{ $eq: ["$status", "redeemed"] }, 1, 0] },
          },
        },
      },
    ]);

    // 4. Fraud attempts & security metrics
    const fraudMetrics = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          totalFraudAttempts: { $sum: "$fraudAttempts" },
          flaggedCoupons: {
            $sum: { $cond: [{ $gt: ["$fraudAttempts", 0] }, 1, 0] },
          },
        },
      },
    ]);

    // 5. Overall transaction counts by type
    const txByType = await Transaction.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        redemptionsPerDay,
        topCoupons,
        categoryDistribution,
        fraudSummary: fraudMetrics[0] || { totalFraudAttempts: 0, flaggedCoupons: 0 },
        transactionsByType: txByType,
      },
    });
  } catch (error) {
    next(error);
  }
};
