import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { User, Mail, Wallet, Shield, CheckCircle2, Loader2 } from "lucide-react";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { account, connectWallet } = useWeb3();

  const [name, setName] = useState(user?.name || "");
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await updateProfile({ name, walletAddress });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      alert("Failed to update profile: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLinkMetaMask = async () => {
    const connected = await connectWallet();
    if (connected) {
      setWalletAddress(connected);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <span className="text-xs font-mono uppercase text-brand-500 font-bold">Account Center</span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Profile & Cryptographic Wallet</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your credentials and linked Ethereum address for automated cashback disbursements.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-8 border border-slate-700/80 shadow-2xl">
        {success && (
          <div className="p-3 mb-5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile and wallet binding updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Email cannot be changed directly.</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Bound Ethereum Settlement Address</label>
              <button
                type="button"
                onClick={handleLinkMetaMask}
                className="text-[11px] font-mono text-brand-400 hover:text-brand-300 underline"
              >
                Link from MetaMask
              </button>
            </div>
            <div className="relative">
              <Wallet className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={walletAddress || account || ""}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile Updates"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
