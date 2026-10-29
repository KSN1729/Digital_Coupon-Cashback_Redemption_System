import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Tag,
  Coins,
  History,
  QrCode,
  ShieldAlert,
  Users,
  Store,
  BarChart3,
  Settings,
  PlusCircle,
  FileCheck,
} from "lucide-react";

const Sidebar = () => {
  const { isCustomer, isMerchant, isAdmin } = useAuth();
  const location = useLocation();

  const customerLinks = [
    { name: "My Dashboard", path: "/customer", icon: LayoutDashboard },
    { name: "Claimed Coupons", path: "/wallet", icon: Tag },
    { name: "Cashback Vault", path: "/cashback-history", icon: Coins },
    { name: "On-Chain Activity", path: "/transactions", icon: History },
  ];

  const merchantLinks = [
    { name: "Merchant Console", path: "/merchant", icon: LayoutDashboard },
    { name: "Issued Coupons", path: "/merchant/coupons", icon: Tag },
    { name: "Issue New Coupon", path: "/merchant/create", icon: PlusCircle },
    { name: "POS Verifier / Scanner", path: "/merchant/verify", icon: QrCode },
    { name: "Redemption History", path: "/merchant/redemptions", icon: FileCheck },
  ];

  const adminLinks = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Merchant Approvals", path: "/admin/merchants", icon: Store },
    { name: "User Directory", path: "/admin/users", icon: Users },
    { name: "Blockchain Ledger", path: "/admin/ledger", icon: History },
    { name: "Fraud & Audit Logs", path: "/admin/audit", icon: ShieldAlert },
    { name: "System Analytics", path: "/analytics", icon: BarChart3 },
  ];

  const links = isAdmin ? adminLinks : isMerchant ? merchantLinks : customerLinks;

  return (
    <aside className="w-64 glass-panel border-r border-slate-200/80 dark:border-slate-800/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="px-3">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
            {isAdmin ? "Super Admin Portal" : isMerchant ? "Merchant Station" : "Customer Vault"}
          </p>
        </div>

        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-brand-600/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/20 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-brand-500" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
        <Link
          to="/settings"
          className="flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Security & Node Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
