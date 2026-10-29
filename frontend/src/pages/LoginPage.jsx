import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import {
  Lock,
  Mail,
  Wallet,
  ArrowRight,
  AlertCircle,
  Loader2,
  Shield,
  Layers,
} from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [web3Loading, setWeb3Loading] = useState(false);

  const { login, loginWithWeb3 } = useAuth();
  const { account, signer, connectWallet } = useWeb3();
  const navigate = useNavigate();

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "merchant") navigate("/merchant");
      else navigate("/customer");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleWeb3Login = async () => {
    setError(null);
    setWeb3Loading(true);

    try {
      let activeAccount = account;
      let activeSigner = signer;

      if (!activeAccount || !activeSigner) {
        activeAccount = await connectWallet();
        if (!activeAccount) {
          throw new Error("Please connect your MetaMask wallet first.");
        }
      }

      const data = await loginWithWeb3(activeAccount, signer, "customer");
      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "merchant") navigate("/merchant");
      else navigate("/customer");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Web3 Login Failed");
    } finally {
      setWeb3Loading(false);
    }
  };

  const fillQuickDemo = (role) => {
    if (role === "admin") {
      setEmail("admin@couponchain.io");
      setPassword("AdminPassword123!");
    } else if (role === "merchant") {
      setEmail("cybertech@merchant.io");
      setPassword("MerchantPassword123!");
    } else {
      setEmail("alice@customer.io");
      setPassword("CustomerPassword123!");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 border border-slate-700/80 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-glow">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Welcome Back</h2>
          <p className="text-xs text-slate-400">Authenticate securely into the CouponChain Protocol</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Web3 Signature Login Button */}
        <button
          onClick={handleWeb3Login}
          disabled={web3Loading}
          className="w-full py-3 px-4 rounded-xl font-semibold text-xs border border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          {web3Loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying MetaMask Signature...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 text-brand-400" /> Sign In with MetaMask (EIP-191)
            </>
          )}
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] font-mono text-slate-500 uppercase tracking-widest absolute">
            Or Password
          </span>
        </div>

        {/* Standard Email/Password Form */}
        <form onSubmit={handleStandardLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In with Credentials"}
          </button>
        </form>

        {/* Quick Demo Pre-fillers for Testing */}
        <div className="pt-2 border-t border-slate-800/80">
          <p className="text-[11px] font-mono text-slate-500 text-center mb-2">Demo 1-Click Credentials:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickDemo("admin")}
              className="py-1 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] font-mono text-amber-400 border border-slate-700 transition-colors"
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo("merchant")}
              className="py-1 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] font-mono text-emerald-400 border border-slate-700 transition-colors"
            >
              Merchant Demo
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo("customer")}
              className="py-1 px-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] font-mono text-sky-400 border border-slate-700 transition-colors"
            >
              Customer Demo
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
