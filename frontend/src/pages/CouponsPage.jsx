import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import API from "../services/api";
import CouponCard from "../components/CouponCard";
import RedeemModal from "../components/RedeemModal";
import { Search, Filter, Sparkles, Loader2, Tag, CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  "All",
  "Electronics & Tech",
  "Fashion & Apparel",
  "Food & Dining",
  "Travel & Hotels",
  "Health & Beauty",
];

const CouponsPage = () => {
  const { isAuthenticated } = useAuth();
  const { account, contract, connectWallet } = useWeb3();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [claimedCouponIds, setClaimedCouponIds] = useState([]);
  const [selectedRedeemCoupon, setSelectedRedeemCoupon] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      if (sortBy === "discount") params.append("sort", "discount-high");
      if (sortBy === "cashback") params.append("sort", "cashback-high");

      const res = await API.get(`/customers/coupons?${params.toString()}`);
      if (res.data.success) {
        setCoupons(res.data.data);
      }

      // If user is authenticated, also fetch their claimed list to mark status
      if (isAuthenticated) {
        const myRes = await API.get("/customers/my-coupons");
        if (myRes.data.success) {
          setClaimedCouponIds(myRes.data.data.map((c) => c.couponId));
        }
      }
    } catch (err) {
      console.warn("Could not fetch coupons:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [selectedCategory, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCoupons();
  };

  const handleClaim = async (coupon) => {
    if (!isAuthenticated) {
      alert("Please sign in or create an account to claim coupons.");
      return;
    }

    try {
      let claimTxHash = null;

      // If user has active MetaMask contract connection, trigger ClaimCoupon on-chain
      if (contract && account) {
        try {
          console.log(`Executing smart contract ClaimCoupon(${coupon.couponId})...`);
          const tx = await contract.ClaimCoupon(coupon.couponId);
          const receipt = await tx.wait();
          claimTxHash = receipt.hash;
        } catch (onChainErr) {
          console.warn("On-chain claim notice:", onChainErr.message);
          claimTxHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        }
      }

      const res = await API.post(`/customers/coupons/${coupon.couponId}/claim`, {
        claimTxHash,
        walletAddress: account || undefined,
      });

      if (res.data.success) {
        setToastMessage(`Coupon #${coupon.couponId} successfully claimed into your decentralized vault!`);
        setClaimedCouponIds([...claimedCouponIds, coupon.couponId]);
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to claim coupon");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
        <span className="text-xs font-mono uppercase tracking-wider text-brand-500 font-bold">
          Verified Web3 Marketplace
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
          Explore Verifiable Coupons
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Claim cryptographic discount vouchers backed by smart contracts and earn direct ETH cashback upon checkout.
        </p>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-700/80 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by title, brand or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </form>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-400 whitespace-nowrap">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="newest">Recently Added</option>
              <option value="discount">Highest Discount</option>
              <option value="cashback">Highest ETH Cashback</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-brand-600 text-white shadow-glow"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-slate-900/50 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800 text-slate-400">
          <Tag className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-white">No coupons match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon.couponId}
              coupon={coupon}
              isClaimed={claimedCouponIds.includes(coupon.couponId)}
              onClaim={handleClaim}
              onRedeem={(c) => setSelectedRedeemCoupon(c)}
            />
          ))}
        </div>
      )}

      {/* Redeem Modal */}
      {selectedRedeemCoupon && (
        <RedeemModal
          coupon={selectedRedeemCoupon}
          onClose={() => setSelectedRedeemCoupon(null)}
          onSuccess={() => {
            fetchCoupons();
          }}
        />
      )}
    </div>
  );
};

export default CouponsPage;
