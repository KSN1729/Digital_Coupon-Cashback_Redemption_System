const express = require("express");
const router = express.Router();
const {
  register,
  login,
  requestNonce,
  verifySignature,
  getMe,
  updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

router.post("/register", logAudit("USER_REGISTER", "AUTH"), register);
router.post("/login", logAudit("USER_LOGIN", "AUTH"), login);
router.post("/nonce", requestNonce);
router.post("/verify-signature", logAudit("WALLET_AUTH", "AUTH"), verifySignature);
router.get("/me", protect, getMe);
router.put("/profile", protect, logAudit("UPDATE_PROFILE", "USER"), updateProfile);

module.exports = router;
