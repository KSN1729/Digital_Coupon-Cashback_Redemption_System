import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import CouponCard from "../components/CouponCard";
import RedeemModal from "../components/RedeemModal";
import { Wallet, Tag, ArrowRight, Loader2, Sparkles } from "lucide-react";

const WalletPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedRedeemCoupon, setSelectedRedeemCoupon] = useState(null);

  const fetchVault = async () => {
    try {
      setLoading(true);
      const res = await API.get("/customers/my-coupons");
      if (res.data.success) {
        setCoupons(res.data.data);
      }
    } catch (err) {
      console.warn("Vault fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVault();
  }, []);

  const filteredCoupons = coupons.filter((c) => {
    if (filter === "ready") return c.status === "claimed";
    if (filter === "redeemed") return c.status === "redeemed";
    if (filter === "expired") return c.status === "expired" || new Date(c.expiryDate).getTime() < Date.now();
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase text-brand-500 font-bold">Personal Portfolio</span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">My Coupon Vault</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Coupons claimed and cryptographically bound to your wallet address.
          </p>
        </div>

        <Link
          to="/coupons"
          className="py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" /> Claim More Coupons
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setFilter("all")}
          className={`pb-3 transition-colors ${
            filter === "all" ? "text-brand-400 border-b-2 border-brand-500" : "text-slate-400 hover:text-white"
          }`}
        >
          All Claimed ({coupons.length})
        </button>
        <button
          onClick={() => setFilter("ready")}
          className={`pb-3 transition-colors ${
            filter === "ready" ? "text-brand-400 border-b-2 border-brand-500" : "text-slate-400 hover:text-white"
          }`}
        >
          Ready to Redeem ({coupons.filter((c) => c.status === "claimed").length})
        </button>
        <button
          onClick={() => setFilter("redeemed")}
          className={`pb-3 transition-colors ${
            filter === "redeemed" ? "text-brand-400 border-b-2 border-brand-500" : "text-slate-400 hover:text-white"
          }`}
        >
          Redeemed ({coupons.filter((c) => c.status === "redeemed").length})
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-slate-900/50 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800 text-slate-400">
          <Wallet className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">No coupons in this view</h3>
          <p className="text-xs text-slate-500 mt-1">Explore our marketplace to claim exciting discount vouchers.</p>
          <Link
            to="/coupons"
            className="inline-block mt-4 py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => (
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

      {selectedRedeemCoupon && (
        <RedeemModal
          coupon={selectedRedeemCoupon}
          onClose={() => setSelectedRedeemCoupon(null)}
          onSuccess={() => {
            fetchVault();
          }}
        />
      )}
    </div>
  );
};

export default WalletPage;
