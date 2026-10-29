import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { DEFAULT_ABI, HARDHAT_CHAIN_ID } from "../services/web3Service";
import deploymentData from "../contracts/contractDeployment.json";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState(deploymentData.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3");
  const [balance, setBalance] = useState("0.0");
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const updateBalance = useCallback(async (currentAccount, currentProvider) => {
    try {
      if (currentAccount && currentProvider) {
        const bal = await currentProvider.getBalance(currentAccount);
        setBalance(Number(ethers.formatEther(bal)).toFixed(4));
      }
    } catch (e) {
      console.warn("Could not fetch balance:", e.message);
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setError("MetaMask is not installed. Please install MetaMask to use Web3 features.");
      return null;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const web3Signer = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      const currentAddress = accounts[0];
      setAccount(currentAddress);
      setProvider(browserProvider);
      setSigner(web3Signer);
      setChainId(network.chainId.toString());

      await updateBalance(currentAddress, browserProvider);

      // Initialize contract instance
      if (contractAddress) {
        const instance = new ethers.Contract(contractAddress, DEFAULT_ABI, web3Signer);
        setContract(instance);
      }

      setIsConnecting(false);
      return currentAddress;
    } catch (err) {
      console.error("Web3 Connection Error:", err);
      setError(err.message || "Failed to connect wallet");
      setIsConnecting(false);
      return null;
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setContract(null);
    setBalance("0.0");
  };

  // Re-instantiate contract when contractAddress changes
  useEffect(() => {
    if (contractAddress && signer) {
      const instance = new ethers.Contract(contractAddress, DEFAULT_ABI, signer);
      setContract(instance);
    }
  }, [contractAddress, signer]);

  // Listen to MetaMask account and chain changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const web3Signer = await browserProvider.getSigner();
          setAccount(accounts[0]);
          setSigner(web3Signer);
          updateBalance(accounts[0], browserProvider);
        } else {
          disconnectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [updateBalance]);

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        contract,
        contractAddress,
        balance,
        chainId,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        updateBalance,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
