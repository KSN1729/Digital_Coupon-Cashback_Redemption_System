import React from "react";
import { useWeb3 } from "../context/Web3Context";
import { Cpu, Shield, Globe, Terminal, CheckCircle2 } from "lucide-react";

const SettingsPage = () => {
  const { account, chainId, contractAddress } = useWeb3();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <span className="text-xs font-mono uppercase text-brand-500 font-bold">Node & Environment</span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Blockchain Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Network connectivity parameters, smart contract artifacts, and RPC configuration.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-slate-700/80 shadow-2xl space-y-6">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Cpu className="w-4 h-4 text-brand-400" />
            <span>Smart Contract Deployment</span>
          </div>
          <div className="text-xs font-mono space-y-1 text-slate-400">
            <p>
              Contract Address:{" "}
              <span className="text-brand-300 break-all">{contractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}</span>
            </p>
            <p>EVM Target: Paris / Solidity 0.8.24</p>
            <p>Chain ID: {chainId || "31337 (Local Hardhat)"}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>RPC Endpoint Configuration</span>
          </div>
          <div className="text-xs font-mono text-slate-400 space-y-1">
            <p>Primary Local RPC: http://127.0.0.1:8545</p>
            <p>Fallback Testnet: Sepolia Ethereum</p>
            <p className="text-emerald-400 flex items-center gap-1 text-[11px] pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Client WebSocket Listener: Connected
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Cryptographic Security Standards</span>
          </div>
          <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
            <p>&bull; Signatures: EIP-191 Personal Sign with Dynamic Nonce Protection</p>
            <p>&bull; Coupon Hash: Keccak256(couponId, code, merchantWallet, discount, expiry)</p>
            <p>&bull; Double-Redemption Prevention: Atomic State Locking with ReentrancyGuard</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
