import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import API from "../services/api";
import StatsCard from "../components/StatsCard";
import CouponCard from "../components/CouponCard";
import RedeemModal from "../components/RedeemModal";
import {
  Tag,
  Coins,
  ShieldCheck,
  History,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Wallet,
  AlertCircle,
} from "lucide-react";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { account, balance, connectWallet } = useWeb3();
  const [claimedCoupons, setClaimedCoupons] = useState([]);
  const [cashbacks, setCashbacks] = useState([]);
  const [stats, setStats] = useState({
    totalEarnedEth: 0,
    totalEarnedUSD: 0,
    activeCount: 0,
  });
  const [selectedRedeemCoupon, setSelectedRedeemCoupon] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [couponsRes, cashbackRes] = await Promise.all([
        API.get("/customers/my-coupons"),
        API.get("/customers/cashbacks"),
      ]);

      if (couponsRes.data.success) {
        setClaimedCoupons(couponsRes.data.data);
      }

      if (cashbackRes.data.success) {
        setCashbacks(cashbackRes.data.data);
        setStats({
          totalEarnedEth: cashbackRes.data.totalEarnedEth || 0,
          totalEarnedUSD: cashbackRes.data.totalEarnedUSD || 0,
          activeCount: couponsRes.data.data.filter((c) => c.status === "claimed").length,
        });
      }
    } catch (err) {
      console.warn("Dashboard fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-brand-500 font-bold">Personal Vault</span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Welcome back, {user?.name?.split(" ")[0] || "Shopper"}!
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your claimed cryptographic vouchers and track automated smart contract cashback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/coupons"
            className="py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" /> Browse New Coupons
          </Link>
        </div>
      </div>

      {/* Wallet Connection Alert if not linked */}
      {!account && (
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs">
              <strong>MetaMask Not Connected:</strong> Connect your wallet to claim coupons and receive instant ETH
              cashback transfers upon redemption.
            </p>
          </div>
          <button
            onClick={connectWallet}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm shrink-0"
          >
            Connect MetaMask
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Active Claimed Vouchers"
          value={stats.activeCount}
          icon={Tag}
          change="Available"
          subtext="Ready to redeem"
        />
        <StatsCard
          title="Cashback Rewards Earned"
          value={`${stats.totalEarnedEth} ETH`}
          icon={Coins}
          change={`$${stats.totalEarnedUSD}`}
          subtext="Smart contract disbursed"
        />
        <StatsCard
          title="MetaMask Balance"
          value={`${balance} ETH`}
          icon={Wallet}
          change="Live"
          subtext={account ? `${account.substring(0, 6)}...${account.slice(-4)}` : "Disconnected"}
        />
        <StatsCard
          title="Security Assurance"
          value="100% Anti-Fraud"
          icon={ShieldCheck}
          change="Active"
          subtext="Zero double-spending"
        />
      </div>

      {/* Ready to Redeem Coupons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-brand-500" /> My Claimed Vouchers
          </h2>
          <Link to="/wallet" className="text-xs font-semibold text-brand-500 hover:text-brand-400 flex items-center gap-1">
            View All in Vault <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {claimedCoupons.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center border border-slate-800 text-slate-400">
            <Tag className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold">No coupons claimed yet</p>
            <p className="text-xs text-slate-500 mt-1">Browse active marketplace coupons and claim one to your wallet.</p>
            <Link
              to="/coupons"
              className="inline-block mt-4 py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
            >
              Explore Coupons
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {claimedCoupons.slice(0, 3).map((coupon) => (
              <CouponCard
                key={coupon.couponId}
                coupon={coupon}
                isClaimed={coupon.status === "claimed"}
                isRedeemed={coupon.status === "redeemed"}
                onRedeem={(c) => setSelectedRedeemCoupon(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Cashback & On-Chain Transactions */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" /> Recent Cashback Disbursements
          </h3>
          <Link to="/cashback-history" className="text-xs text-brand-400 hover:underline">
            Full Ledger
          </Link>
        </div>

        {cashbacks.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No cashbacks disbursed yet. Redeem a coupon to earn rewards.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-mono text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="pb-3">Coupon ID</th>
                  <th className="pb-3">Cashback Reward</th>
                  <th className="pb-3">USD Value</th>
                  <th className="pb-3">Blockchain Tx</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {cashbacks.slice(0, 5).map((cb) => (
                  <tr key={cb._id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-semibold text-white">#{cb.couponId}</td>
                    <td className="py-3 text-emerald-400 font-bold">+{cb.amountEth} ETH</td>
                    <td className="py-3 text-slate-400">${cb.amountUSD}</td>
                    <td className="py-3 text-[11px] text-slate-500 truncate max-w-[120px]">
                      {cb.blockchainTxHash ? `${cb.blockchainTxHash.substring(0, 10)}...` : "Confirmed"}
                    </td>
                    <td className="py-3 text-slate-400">{new Date(cb.issuedAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Processed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for On-Chain Redemption */}
      {selectedRedeemCoupon && (
        <RedeemModal
          coupon={selectedRedeemCoupon}
          onClose={() => setSelectedRedeemCoupon(null)}
          onSuccess={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
