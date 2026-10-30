const express = require("express");
const router = express.Router();
const {
  browseCoupons,
  getCouponById,
  claimCoupon,
  getCustomerCoupons,
  redeemCouponByCustomer,
  getCashbackHistory,
  getCustomerTransactions,
} = require("../controllers/customerController");
const { protect } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router.get("/coupons", browseCoupons);
router.get("/coupons/:id", getCouponById);

router.post("/coupons/:id/claim", protect, logAudit("COUPON_CLAIM", "COUPON"), claimCoupon);
router.post("/coupons/:id/redeem", protect, logAudit("COUPON_REDEEM", "COUPON"), redeemCouponByCustomer);
router.get("/my-coupons", protect, getCustomerCoupons);
router.get("/cashbacks", protect, getCashbackHistory);
router.get("/transactions", protect, getCustomerTransactions);

module.exports = router;
