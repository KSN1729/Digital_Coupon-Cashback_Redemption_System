import React from "react";

const StatsCard = ({ title, value, change, icon: Icon, trend = "up", subtext }) => {
  return (
    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-brand-500/40 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 group-hover:scale-[1.02] transition-transform">
            {value}
          </h4>
        </div>
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20 shadow-sm">
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {(change || subtext) && (
        <div className="mt-3 flex items-center text-xs space-x-2">
          {change && (
            <span
              className={`font-semibold px-1.5 py-0.5 rounded text-[10px] font-mono ${
                trend === "up"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {trend === "up" ? "+" : ""}{change}
            </span>
          )}
          {subtext && <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{subtext}</span>}
        </div>
      )}

      {/* Decorative gradient blur background */}
      <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-brand-500/10 rounded-full blur-xl group-hover:bg-brand-500/20 transition-all pointer-events-none" />
    </div>
  );
};

export default StatsCard;
