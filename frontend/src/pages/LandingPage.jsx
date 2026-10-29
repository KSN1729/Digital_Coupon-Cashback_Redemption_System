import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import API from "../services/api";
import CouponCard from "../components/CouponCard";
import {
  ShieldCheck,
  Zap,
  Coins,
  Lock,
  ArrowRight,
  Layers,
  Sparkles,
  TrendingUp,
  Cpu,
  CheckCircle,
} from "lucide-react";

const LandingPage = () => {
  const { isAuthenticated, isMerchant, isCustomer, isAdmin } = useAuth();
  const { connectWallet, account } = useWeb3();
  const [featuredCoupons, setFeaturedCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await API.get("/customers/coupons?limit=3");
        if (res.data.success) {
          setFeaturedCoupons(res.data.data);
        }
      } catch (err) {
        console.warn("Could not load featured coupons:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-mono font-medium mb-8 backdrop-blur-md animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Next-Gen Decentralized Coupon & Cashback Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Eliminate Coupon Fraud with{" "}
            <span className="cyber-gradient-text">Verifiable Blockchain</span> Proof.
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A high-performance hybrid architecture connecting merchants and shoppers. Coupons are secured on Ethereum
            with cryptographic hashing, guaranteeing zero double-redemptions and automated cashback rewards.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/coupons"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-glow flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              Explore Available Coupons
              <ArrowRight className="w-4 h-4" />
            </Link>

            {!account ? (
              <button
                onClick={connectWallet}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl glass-panel hover:bg-slate-800 text-slate-800 dark:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                Connect MetaMask
              </button>
            ) : (
              <Link
                to={isAdmin ? "/admin" : isMerchant ? "/merchant" : "/customer"}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl glass-panel hover:bg-slate-800 text-slate-800 dark:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                Go to Dashboard
              </Link>
            )}
          </div>

          {/* Key Blockchain Guarantees */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Zero Double Redemption</h4>
              <p className="text-[11px] text-slate-400 mt-1">Smart contracts enforce atomic, single-state redemption transitions.</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
              <Lock className="w-5 h-5 text-brand-400 mb-2" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tamper-Proof Hashing</h4>
              <p className="text-[11px] text-slate-400 mt-1">Keccak256 cryptographic hashes guarantee discount integrity.</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
              <Coins className="w-5 h-5 text-amber-400 mb-2" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Automated Cashback</h4>
              <p className="text-[11px] text-slate-400 mt-1">Direct ETH disbursement to claimed customer wallets on redemption.</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-800/80">
              <Cpu className="w-5 h-5 text-indigo-400 mb-2" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Optimized Hybrid</h4>
              <p className="text-[11px] text-slate-400 mt-1">State & verification on-chain; rich metadata off-chain in MongoDB.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Coupons Carousel / Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-brand-500 font-bold">Live Opportunities</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Featured Blockchain Vouchers</h2>
          </div>
          <Link
            to="/coupons"
            className="mt-3 md:mt-0 text-sm font-semibold text-brand-500 hover:text-brand-400 flex items-center gap-1"
          >
            Browse all coupons <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 rounded-2xl bg-slate-900/50 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCoupons.map((coupon) => (
              <CouponCard key={coupon.couponId} coupon={coupon} />
            ))}
          </div>
        )}
      </section>

      {/* Workflow: How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-brand-500 font-bold">End-to-End Workflow</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2">
            How Decentralized Redemption Works
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Industry-standard architecture separating state verification from business storage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="glass-panel p-6 rounded-2xl relative border border-slate-800">
            <span className="text-3xl font-extrabold text-brand-500/40 font-mono">01</span>
            <h3 className="font-bold text-lg text-white mt-2">Merchant Issues</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Merchant creates coupon with discount terms and cashback reward. Metadata is saved in MongoDB while Keccak256 hash is recorded on-chain.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative border border-slate-800">
            <span className="text-3xl font-extrabold text-brand-500/40 font-mono">02</span>
            <h3 className="font-bold text-lg text-white mt-2">Customer Claims</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Customer connects MetaMask and claims coupon into their decentralized vault, updating on-chain ownership to prevent double-claiming.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative border border-slate-800">
            <span className="text-3xl font-extrabold text-brand-500/40 font-mono">03</span>
            <h3 className="font-bold text-lg text-white mt-2">Cryptographic Verify</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              At checkout, presenter proves ownership. Smart contract checks hash, non-expiration, and unredeemed status.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative border border-slate-800">
            <span className="text-3xl font-extrabold text-brand-500/40 font-mono">04</span>
            <h3 className="font-bold text-lg text-white mt-2">Instant Cashback</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Smart contract transitions state to Redeemed and disburses allocated ETH cashback directly to customer wallet.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
