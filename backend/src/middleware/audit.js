const AuditLog = require("../models/AuditLog");

const logAudit = (action, resource) => {
  return async (req, res, next) => {
    // Keep reference to res.json to inspect response status
    const originalJson = res.json;

    res.json = function (data) {
      res.json = originalJson;

      // Asynchronously record audit log without blocking client response
      setTimeout(async () => {
        try {
          const status = res.statusCode >= 400 ? "FAILURE" : "SUCCESS";
          await AuditLog.create({
            userId: req.user ? req.user._id : null,
            userRole: req.user ? req.user.role : "anonymous",
            walletAddress: req.user ? req.user.walletAddress : (req.body ? req.body.walletAddress : null),
            action,
            resource,
            resourceId: req.params.id || (data && data.data && data.data._id) || null,
            status,
            ipAddress: req.ip || req.connection.remoteAddress || "127.0.0.1",
            userAgent: req.headers["user-agent"] || "",
            details: {
              method: req.method,
              url: req.originalUrl,
              bodyParams: req.method === "POST" || req.method === "PUT" ? { ...req.body, password: undefined } : {},
              statusCode: res.statusCode,
              errorMessage: status === "FAILURE" ? (data ? data.message : "Request failed") : undefined,
            },
          });
        } catch (err) {
          console.error("[AuditLog Error]", err.message);
        }
      }, 0);

      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = { logAudit };
