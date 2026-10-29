import React from "react";
import { Link } from "react-router-dom";
import { Coins, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";

const CouponCard = ({ coupon, onClaim, onRedeem, isClaimed = false, isRedeemed = false }) => {
  const isExpired = new Date(coupon.expiryDate).getTime() < Date.now();

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-brand-500/50 hover:shadow-glow transition-all duration-300">
      {/* Top Banner Image with Overlay */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={coupon.imageUrl || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80"}
          alt={coupon.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Badges on Top */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-brand-600 text-white shadow-md">
            {coupon.discountType === "percentage" ? `${coupon.discountValue}% OFF` : `$${coupon.discountValue} OFF`}
          </span>
          <span className="px-2 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 backdrop-blur-md border border-emerald-500/30 flex items-center gap-1">
            <Coins className="w-3 h-3" />
            +{coupon.cashbackAmountEth} ETH
          </span>
        </div>

        {/* Status pill on Top Right */}
        <div className="absolute top-3 right-3">
          {coupon.status === "redeemed" || isRedeemed ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-800/90 text-slate-300 border border-slate-700">
              Redeemed
            </span>
          ) : coupon.status === "claimed" || isClaimed ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              In Wallet
            </span>
          ) : isExpired ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Expired
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Available
            </span>
          )}
        </div>

        {/* Category Pill */}
        <div className="absolute bottom-3 left-3 text-xs font-medium text-slate-300 bg-slate-900/60 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-slate-700/50">
          {coupon.category}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-400 transition-colors">
            {coupon.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {coupon.description}
          </p>

          {/* Cryptographic hash preview */}
          <div className="mt-3 p-2 rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-brand-500" />
              Hash:
            </span>
            <span className="truncate max-w-[170px]" title={coupon.couponHash}>
              {coupon.couponHash ? `${coupon.couponHash.substring(0, 10)}...${coupon.couponHash.slice(-6)}` : "Verified On-Chain"}
            </span>
          </div>
        </div>

        {/* Footer info & Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-3 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Exp: {new Date(coupon.expiryDate).toLocaleDateString()}
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Min: ${coupon.minimumPurchase || 0}
            </span>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/coupons/${coupon.couponId}`}
              className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              Details
            </Link>

            {/* Dynamic Action Button */}
            {isRedeemed || coupon.status === "redeemed" ? (
              <button
                disabled
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800/40 text-slate-500 border border-slate-700/50 cursor-not-allowed flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Redeemed
              </button>
            ) : isClaimed || coupon.status === "claimed" ? (
              <button
                onClick={() => onRedeem && onRedeem(coupon)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center justify-center gap-1"
              >
                <Coins className="w-3.5 h-3.5" /> Redeem
              </button>
            ) : (
              <button
                onClick={() => onClaim && onClaim(coupon)}
                disabled={isExpired}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Claim Coupon
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponCard;
