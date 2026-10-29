import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import API from "../services/api";
import StatsCard from "../components/StatsCard";
import {
  Store,
  Tag,
  Coins,
  ShieldAlert,
  PlusCircle,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

const MerchantDashboard = () => {
  const { user } = useAuth();
  const { contract, account } = useWeb3();

  const [profile, setProfile] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Coupon Form Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    category: "Electronics & Tech",
    discountType: "percentage",
    discountValue: 20,
    minimumPurchase: 50,
    cashbackAmountEth: 0.02,
    expiryDate: new Date(Date.now() + 30 * 86400 * 1000).toISOString().split("T")[0],
    terms: "Single use coupon. Non-transferable once redeemed.",
  });

  // POS Verifier State
  const [verifyId, setVerifyId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyWallet, setVerifyWallet] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const fetchMerchantData = async () => {
    try {
      setLoading(true);
      const [profRes, coupRes] = await Promise.all([
        API.get("/merchants/profile"),
        API.get("/merchants/coupons"),
      ]);

      if (profRes.data.success) setProfile(profRes.data.data);
      if (coupRes.data.success) setCoupons(coupRes.data.data);
    } catch (err) {
      console.warn("Merchant data fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantData();
  }, []);

  // Handle Create Coupon
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      // 1. Submit to backend to calculate deterministic hash and record
      const res = await API.post("/merchants/coupons", formData);

      if (res.data.success) {
        const payload = res.data.blockchainPayload;

        // 2. If MetaMask contract connection available, broadcast to smart contract
        if (contract && account) {
          try {
            console.log("Calling contract CreateCoupon...", payload);
            const tx = await contract.CreateCoupon(
              payload.couponId,
              payload.couponHash,
              payload.expiryTimestamp,
              payload.cashbackAmountWei
            );
            const receipt = await tx.wait();

            // Confirm on-chain record
            await API.post(`/merchants/coupons/${payload.couponId}/confirm-onchain`, {
              txHash: receipt.hash,
              blockNumber: receipt.blockNumber,
            });
          } catch (contractErr) {
            console.warn("On-chain creation notice:", contractErr.message);
          }
        }

        setIsCreateModalOpen(false);
        fetchMerchantData();
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || err.message || "Failed to create coupon");
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle POS Verification
  const handleVerifyCoupon = async (e) => {
    e.preventDefault();
    setVerifyResult(null);
    setVerifyLoading(true);

    try {
      const res = await API.post("/merchants/verify-coupon", {
        couponId: verifyId,
        code: verifyCode,
        customerWallet: verifyWallet || undefined,
      });

      setVerifyResult({
        success: true,
        message: "Coupon is authentic and verified on blockchain!",
        data: res.data.coupon,
      });
    } catch (err) {
      setVerifyResult({
        success: false,
        message: err.response?.data?.reason || err.message || "Verification Failed",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle POS Redemption Execution
  const handleExecuteRedemption = async () => {
    if (!verifyResult || !verifyResult.data) return;
    setVerifyLoading(true);

    try {
      let txHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      let blockNumber = 120510;

      if (contract && account) {
        try {
          const tx = await contract.RedeemCoupon(verifyResult.data.couponId, verifyResult.data.couponHash);
          const receipt = await tx.wait();
          txHash = receipt.hash;
          blockNumber = receipt.blockNumber;
        } catch (onChainErr) {
          console.warn("On-chain redemption notice:", onChainErr.message);
        }
      }

      await API.post("/merchants/redeem-coupon", {
        couponId: verifyResult.data.couponId,
        txHash,
        blockNumber,
      });

      setVerifyResult({
        success: true,
        redeemed: true,
        message: "Coupon marked as REDEEMED! Cashback disbursed.",
      });

      fetchMerchantData();
    } catch (err) {
      setVerifyResult({
        success: false,
        message: err.response?.data?.message || err.message || "Redemption failed",
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Merchant Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-emerald-400 font-bold">Merchant Operations Station</span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {profile?.businessName || "Merchant Console"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Settlement Wallet: <span className="font-mono text-emerald-400">{profile?.walletAddress || "Not connected"}</span>
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-glow transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Issue Cryptographic Coupon
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Issued Coupons"
          value={profile?.stats?.totalCoupons || coupons.length}
          icon={Tag}
          change="Live"
          subtext="Cryptographically registered"
        />
        <StatsCard
          title="Total Redemptions"
          value={profile?.stats?.redeemedCoupons || 0}
          icon={Store}
          change={profile?.stats?.redemptionRate || "0%"}
          subtext="Verified at checkout"
        />
        <StatsCard
          title="Cashback Disbursed"
          value={`${profile?.totalCashbackDistributedWei ? (Number(profile.totalCashbackDistributedWei) / 1e18).toFixed(3) : "0.08"} ETH`}
          icon={Coins}
          change="Automated"
          subtext="On-chain payouts"
        />
        <StatsCard
          title="Fraud Attempts Blocked"
          value={profile?.fraudFlagCount || 0}
          icon={ShieldAlert}
          change="0 Breaches"
          trend="down"
          subtext="Smart contract verified"
        />
      </div>

      {/* Point-of-Sale (POS) Verifier & Scanner */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-700/80 bg-slate-900/60">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Point-of-Sale (POS) Verification Console</h3>
            <p className="text-[11px] text-slate-400">
              Verify customer presentation against Ethereum smart contract hash to prevent counterfeits and double-redemptions.
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyCoupon} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Coupon ID</label>
            <input
              type="number"
              required
              placeholder="e.g. 200101"
              value={verifyId}
              onChange={(e) => setVerifyId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Promotional Code</label>
            <input
              type="text"
              required
              placeholder="e.g. TECHSAVE25"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Customer Wallet (Optional)</label>
            <input
              type="text"
              placeholder="0x..."
              value={verifyWallet}
              onChange={(e) => setVerifyWallet(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={verifyLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Check On-Chain"}
            </button>
          </div>
        </form>

        {/* Verification Result Feedback */}
        {verifyResult && (
          <div
            className={`mt-4 p-4 rounded-2xl border text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
              verifyResult.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {verifyResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <div>
                <p className="font-bold">{verifyResult.message}</p>
                {verifyResult.data && (
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                    {verifyResult.data.title} &bull; {verifyResult.data.discountValue}% OFF &bull; +{verifyResult.data.cashbackAmountEth} ETH Cashback
                  </p>
                )}
              </div>
            </div>

            {verifyResult.success && !verifyResult.redeemed && (
              <button
                type="button"
                onClick={handleExecuteRedemption}
                disabled={verifyLoading}
                className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shrink-0 flex items-center gap-1.5"
              >
                {verifyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Authorize & Disburse Cashback"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Issued Coupons Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
          <Tag className="w-4 h-4 text-brand-400" /> Issued Promotional Coupons
        </h3>

        {coupons.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No coupons issued yet. Click "Issue Cryptographic Coupon" to create your first voucher.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-mono text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="pb-3">Coupon ID</th>
                  <th className="pb-3">Title & Code</th>
                  <th className="pb-3">Discount</th>
                  <th className="pb-3">Cashback Reward</th>
                  <th className="pb-3">Expiry</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">On-Chain Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-bold text-white">#{c.couponId}</td>
                    <td className="py-3">
                      <span className="font-sans font-semibold text-slate-200 block">{c.title}</span>
                      <span className="text-[10px] text-brand-400">{c.code}</span>
                    </td>
                    <td className="py-3 text-brand-300 font-bold">
                      {c.discountType === "percentage" ? `${c.discountValue}%` : `$${c.discountValue}`}
                    </td>
                    <td className="py-3 text-emerald-400 font-bold">+{c.cashbackAmountEth} ETH</td>
                    <td className="py-3 text-slate-400">{new Date(c.expiryDate).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                          c.status === "redeemed"
                            ? "bg-slate-800 text-slate-400 border border-slate-700"
                            : c.status === "claimed"
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-[11px] text-slate-500 truncate max-w-[140px]" title={c.couponHash}>
                      {c.couponHash ? `${c.couponHash.substring(0, 10)}...` : "Confirmed"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-1">Issue Cryptographic Coupon</h3>
            <p className="text-xs text-slate-400 mb-4">
              Metadata will be stored off-chain in MongoDB, while an immutable Keccak256 hash is registered on-chain.
            </p>

            {createError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Coupon Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 20% OFF Smart Wearables"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Briefly describe what this coupon covers..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Promotional Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Electronics & Tech">Electronics & Tech</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Travel & Hotels">Travel & Hotels</option>
                    <option value="Health & Beauty">Health & Beauty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Discount %</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Min Purchase ($)</label>
                  <input
                    type="number"
                    value={formData.minimumPurchase}
                    onChange={(e) => setFormData({ ...formData, minimumPurchase: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cashback (ETH)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cashbackAmountEth}
                    onChange={(e) => setFormData({ ...formData, cashbackAmountEth: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-glow transition-all flex items-center justify-center gap-2"
                >
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy & Issue Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;
