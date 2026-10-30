const express = require("express");
const router = express.Router();
const {
  getAdminOverview,
  getMerchants,
  updateMerchantStatus,
  getUsers,
  updateUserStatus,
  getCategories,
  createCategory,
  getTransactions,
  getAuditLogs,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const { logAudit } = require("../middleware/audit");

// Public category read
router.get("/categories", getCategories);

// Protected Admin APIs
router.use(protect);
router.use(authorize("admin"));

router.get("/overview", getAdminOverview);
router.get("/merchants", getMerchants);
router.put("/merchants/:id/status", logAudit("UPDATE_MERCHANT_STATUS", "MERCHANT"), updateMerchantStatus);
router.get("/users", getUsers);
router.put("/users/:id/status", logAudit("UPDATE_USER_STATUS", "USER"), updateUserStatus);
router.post("/categories", logAudit("CREATE_CATEGORY", "CATEGORY"), createCategory);
router.get("/transactions", getTransactions);
router.get("/audit-logs", getAuditLogs);

module.exports = router;
