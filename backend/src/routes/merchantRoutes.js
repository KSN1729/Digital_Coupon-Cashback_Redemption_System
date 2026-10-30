const express = require("express");
const router = express.Router();
const {
  getMerchantProfile,
  createCoupon,
  confirmOnChainCoupon,
  getMerchantCoupons,
  verifyCouponPresentation,
  redeemCoupon,
} = require("../controllers/merchantController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router.use(protect);
router.use(authorize("merchant", "admin"));

router.get("/profile", getMerchantProfile);
router.get("/coupons", getMerchantCoupons);
router.post("/coupons", logAudit("COUPON_CREATE", "COUPON"), createCoupon);
router.post("/coupons/:id/confirm-onchain", logAudit("ONCHAIN_CONFIRM", "BLOCKCHAIN"), confirmOnChainCoupon);
router.post("/verify-coupon", logAudit("VERIFY_COUPON", "COUPON"), verifyCouponPresentation);
router.post("/redeem-coupon", logAudit("REDEEM_COUPON", "COUPON"), redeemCoupon);

module.exports = router;
