import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Coins, History, ExternalLink, Loader2 } from "lucide-react";

const CashbackHistoryPage = () => {
  const [cashbacks, setCashbacks] = useState([]);
  const [summary, setSummary] = useState({ totalEth: 0, totalUSD: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCashbacks = async () => {
      try {
        setLoading(true);
        const res = await API.get("/customers/cashbacks");
        if (res.data.success) {
          setCashbacks(res.data.data);
          setSummary({
            totalEth: res.data.totalEarnedEth || 0,
            totalUSD: res.data.totalEarnedUSD || 0,
          });
        }
      } catch (err) {
        console.warn("Could not fetch cashback history:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCashbacks();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      <div>
        <span className="text-xs font-mono uppercase text-emerald-400 font-bold">Reward Ledger</span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Cashback Payout History</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cryptographically recorded ETH transfers disbursed directly to your wallet upon coupon redemption.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-xs font-mono text-emerald-400 uppercase font-semibold">Total Cashback Earned</span>
          <h2 className="text-4xl font-extrabold text-white mt-2">+{summary.totalEth} ETH</h2>
          <p className="text-xs text-slate-400 mt-1">Directly disbursed via Smart Contract</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <span className="text-xs font-mono text-slate-400 uppercase font-semibold">Estimated Fiat Equivalent</span>
          <h2 className="text-4xl font-extrabold text-white mt-2">${summary.totalUSD} USD</h2>
          <p className="text-xs text-slate-400 mt-1">Based on benchmark exchange rate</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-brand-400" /> Automated On-Chain Disbursements
        </h3>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" />
          </div>
        ) : cashbacks.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            No cashback records found. Redeem an active coupon to trigger an automated cashback payment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[11px] text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="pb-3">Coupon ID</th>
                  <th className="pb-3">Reward (ETH)</th>
                  <th className="pb-3">USD Equivalent</th>
                  <th className="pb-3">Recipient Wallet</th>
                  <th className="pb-3">Tx Hash</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {cashbacks.map((cb) => (
                  <tr key={cb._id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-bold text-white">#{cb.couponId}</td>
                    <td className="py-3 text-emerald-400 font-bold">+{cb.amountEth} ETH</td>
                    <td className="py-3 text-slate-400">${cb.amountUSD}</td>
                    <td className="py-3 text-[11px] text-slate-400 truncate max-w-[130px]">{cb.customerWallet}</td>
                    <td className="py-3 text-[11px] text-brand-400 truncate max-w-[150px]" title={cb.blockchainTxHash}>
                      {cb.blockchainTxHash}
                    </td>
                    <td className="py-3 text-slate-400">{new Date(cb.issuedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashbackHistoryPage;
