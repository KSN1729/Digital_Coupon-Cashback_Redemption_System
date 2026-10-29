import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { useTheme } from "../context/ThemeContext";
import {
  Wallet,
  LogOut,
  User,
  Sun,
  Moon,
  Shield,
  Store,
  Tag,
  Menu,
  X,
  ChevronDown,
  Layers,
} from "lucide-react";

const Navbar = () => {
  const { user, isAuthenticated, logout, isCustomer, isMerchant, isAdmin } = useAuth();
  const { account, balance, connectWallet, isConnecting } = useWeb3();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleWalletClick = async () => {
    if (!account) {
      await connectWallet();
    }
  };

  const getDashboardLink = () => {
    if (isAdmin) return "/admin";
    if (isMerchant) return "/merchant";
    return "/customer";
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-sky-500 to-indigo-500 flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Coupon<span className="text-brand-500">Chain</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
              SOL-0.8.24
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            to="/coupons"
            className="text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5"
          >
            <Tag className="w-4 h-4" />
            Explore Coupons
          </Link>
          <Link
            to="/analytics"
            className="text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
          >
            Analytics
          </Link>
          {isAuthenticated && (
            <Link
              to={getDashboardLink()}
              className="text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors flex items-center gap-1"
            >
              {isAdmin && <Shield className="w-4 h-4 text-amber-500" />}
              {isMerchant && <Store className="w-4 h-4 text-emerald-500" />}
              Dashboard
            </Link>
          )}
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* MetaMask Web3 Wallet Pill */}
          <button
            onClick={handleWalletClick}
            disabled={isConnecting}
            className={`flex items-center space-x-2 text-xs font-mono px-3.5 py-1.5 rounded-full border transition-all ${
              account
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "bg-brand-500/10 hover:bg-brand-500/20 border-brand-500/30 text-brand-600 dark:text-brand-400"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>
              {account
                ? `${account.substring(0, 6)}...${account.substring(account.length - 4)} (${balance} ETH)`
                : isConnecting
                ? "Connecting..."
                : "Connect MetaMask"}
            </span>
          </button>

          {/* Auth Button or Profile Dropdown */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 text-sm p-1 rounded-full hover:ring-2 hover:ring-brand-500/50 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase">
                  {user?.name?.substring(0, 2) || "U"}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 rounded-xl glass-dropdown shadow-2xl py-2 z-50 text-slate-800 dark:text-slate-200 border border-slate-700/50"
                >
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                      {user?.role}
                    </span>
                  </div>

                  <Link
                    to={getDashboardLink()}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    Dashboard
                  </Link>

                  {isCustomer && (
                    <>
                      <Link
                        to="/wallet"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                      >
                        My Coupon Vault
                      </Link>
                      <Link
                        to="/cashback-history"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                      >
                        Cashback Rewards
                      </Link>
                    </>
                  )}

                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 mr-2" />
                    Profile & Settings
                  </Link>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      navigate("/");
                    }}
                    className="w-full flex items-center px-4 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-glow transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-2 border-t border-slate-800 glass-dropdown">
          <Link
            to="/coupons"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800"
          >
            Explore Coupons
          </Link>
          <Link
            to="/analytics"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800"
          >
            Analytics
          </Link>
          {isAuthenticated && (
            <Link
              to={getDashboardLink()}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800"
            >
              Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
