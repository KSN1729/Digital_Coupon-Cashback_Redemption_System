import React, { useState, useEffect } from "react";
import API from "../services/api";
import StatsCard from "../components/StatsCard";
import {
  Shield,
  Users,
  Store,
  Tag,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Cpu,
  Search,
  ExternalLink,
} from "lucide-react";

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("merchants");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [ovRes, merRes, usrRes, txRes, audRes] = await Promise.all([
        API.get("/admin/overview"),
        API.get("/admin/merchants"),
        API.get("/admin/users"),
        API.get("/admin/transactions?limit=20"),
        API.get("/admin/audit-logs?limit=20"),
      ]);

      if (ovRes.data.success) setOverview(ovRes.data.stats);
      if (merRes.data.success) setMerchants(merRes.data.data);
      if (usrRes.data.success) setUsers(usrRes.data.data);
      if (txRes.data.success) setTransactions(txRes.data.data);
      if (audRes.data.success) setAuditLogs(audRes.data.data);
    } catch (err) {
      console.warn("Admin data error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateMerchantStatus = async (merchantId, status) => {
    try {
      setActionLoading(true);
      await API.put(`/admin/merchants/${merchantId}/status`, { status });
      fetchAdminData();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      setActionLoading(true);
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      await API.put(`/admin/users/${userId}/status`, { status: newStatus });
      fetchAdminData();
    } catch (err) {
      alert("Failed to update user: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-amber-500 font-bold">Protocol Governance Console</span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            System Administrator Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Smart Contract Address:{" "}
            <span className="font-mono text-brand-400">{overview?.blockchain?.contractAddress || "Configured in Hardhat"}</span>
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Verified Merchants"
          value={overview?.merchants?.total || merchants.length}
          icon={Store}
          change={`${overview?.merchants?.pending || 0} Pending`}
          subtext="Merchant network"
        />
        <StatsCard
          title="Total Registered Users"
          value={overview?.users?.total || users.length}
          icon={Users}
          change="Customer base"
          subtext="Web3 authenticated"
        />
        <StatsCard
          title="Total Cashbacks Disbursed"
          value={`${overview?.cashback?.totalEth || 0} ETH`}
          icon={Tag}
          change={`$${overview?.cashback?.totalUSD || 0}`}
          subtext="Processed rewards"
        />
        <StatsCard
          title="Security & Fraud Alerts"
          value={overview?.blockchain?.fraudAlerts || 0}
          icon={AlertTriangle}
          change="0 Vulnerabilities"
          trend="down"
          subtext="Tamper attempts logged"
        />
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("merchants")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "merchants"
              ? "text-brand-400 border-b-2 border-brand-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Store className="w-4 h-4" /> Merchant Approvals ({merchants.length})
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "users"
              ? "text-brand-400 border-b-2 border-brand-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" /> System Users ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "transactions"
              ? "text-brand-400 border-b-2 border-brand-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <History className="w-4 h-4" /> On-Chain Transactions ({transactions.length})
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 transition-colors flex items-center gap-2 ${
            activeTab === "audit"
              ? "text-brand-400 border-b-2 border-brand-500"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Shield className="w-4 h-4" /> Security Audit Trail
        </button>
      </div>

      {/* Tab 1: Merchant Approvals */}
      {activeTab === "merchants" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <h3 className="font-bold text-base text-white mb-4">Merchant Business Profiles & Authorizations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-mono text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="pb-3">Business Name</th>
                  <th className="pb-3">Reg. Number</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Wallet Address</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {merchants.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-semibold text-white font-sans">{m.businessName}</td>
                    <td className="py-3 text-slate-400">{m.registrationNumber}</td>
                    <td className="py-3 text-slate-300">{m.category}</td>
                    <td className="py-3 text-[11px] text-brand-400 truncate max-w-[140px]" title={m.walletAddress}>
                      {m.walletAddress}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          m.approvalStatus === "approved"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : m.approvalStatus === "pending"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {m.approvalStatus}
                      </span>
                    </td>
                    <td className="py-3 text-right space-x-2">
                      {m.approvalStatus !== "approved" && (
                        <button
                          onClick={() => handleUpdateMerchantStatus(m._id, "approved")}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-sans font-semibold transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {m.approvalStatus !== "rejected" && (
                        <button
                          onClick={() => handleUpdateMerchantStatus(m._id, "rejected")}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-[11px] font-sans font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === "users" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <h3 className="font-bold text-base text-white mb-4">Registered Platform Accounts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-mono text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Wallet Address</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-semibold text-white font-sans">{u.name}</td>
                    <td className="py-3 text-slate-400">{u.email}</td>
                    <td className="py-3 uppercase text-[10px] text-brand-300">{u.role}</td>
                    <td className="py-3 text-[11px] text-slate-400 truncate max-w-[140px]" title={u.walletAddress}>
                      {u.walletAddress || "Unlinked"}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                          u.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u._id, u.status)}
                        disabled={actionLoading || u.role === "admin"}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold transition-colors ${
                          u.status === "active"
                            ? "bg-rose-600/20 hover:bg-rose-600/40 text-rose-300"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {u.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Transactions Ledger */}
      {activeTab === "transactions" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <h3 className="font-bold text-base text-white mb-4">Immutable Blockchain Transaction Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-mono text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Coupon ID</th>
                  <th className="pb-3">User Wallet</th>
                  <th className="pb-3">Merchant Wallet</th>
                  <th className="pb-3">Tx Hash</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-semibold text-brand-400">{tx.type}</td>
                    <td className="py-3 text-white">#{tx.couponId}</td>
                    <td className="py-3 text-[11px] text-slate-400 truncate max-w-[120px]">{tx.userWallet || "—"}</td>
                    <td className="py-3 text-[11px] text-slate-400 truncate max-w-[120px]">{tx.merchantWallet || "—"}</td>
                    <td className="py-3 text-[11px] text-slate-400 truncate max-w-[160px] font-mono">
                      {tx.blockchainTxHash}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Security Audit Trail */}
      {activeTab === "audit" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <h3 className="font-bold text-base text-white mb-4">Security Access & Audit Trail</h3>
          <div className="space-y-3 font-mono text-xs">
            {auditLogs.map((log) => (
              <div
                key={log._id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-slate-300"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="font-bold text-white">{log.action}</span>
                  <span className="text-slate-500">[{log.resource}]</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {new Date(log.timestamp).toLocaleTimeString()} &bull; IP: {log.ipAddress}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
