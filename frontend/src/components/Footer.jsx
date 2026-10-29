import React from "react";
import { Layers, ShieldCheck, Cpu, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 glass-panel mt-16 text-slate-500 dark:text-slate-400 text-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xs">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">CouponChain Protocol</span>
          <span>&copy; {new Date().getFullYear()} Decentralized Academic Architecture</span>
        </div>

        <div className="flex items-center space-x-6 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-emerald-500">
            <ShieldCheck className="w-3.5 h-3.5" /> Anti-Double-Redeem: Active
          </span>
          <span className="flex items-center gap-1 text-brand-400">
            <Cpu className="w-3.5 h-3.5" /> EVM Hardhat Local / Sepolia
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
