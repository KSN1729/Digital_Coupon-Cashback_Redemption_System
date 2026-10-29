import { ethers } from "ethers";

// Default contract ABI for fallback if deployment artifact is pending
export const DEFAULT_ABI = [
  "function CreateCoupon(uint256 _couponId, bytes32 _couponHash, uint256 _expiry, uint256 _cashbackAmount) payable",
  "function createCoupon(uint256 _couponId, bytes32 _couponHash, uint256 _expiry, uint256 _cashbackAmount) payable",
  "function ClaimCoupon(uint256 _couponId)",
  "function claimCoupon(uint256 _couponId)",
  "function RedeemCoupon(uint256 _couponId, bytes32 _verificationHash)",
  "function redeemCoupon(uint256 _couponId, bytes32 _verificationHash)",
  "function VerifyCoupon(uint256 _couponId, bytes32 _checkHash) view returns (bool isValid, uint8 statusCode, address customer, uint256 expiry, uint256 cashbackAmount)",
  "function verifyCoupon(uint256 _couponId, bytes32 _checkHash) view returns (bool isValid, uint8 statusCode, address customer, uint256 expiry, uint256 cashbackAmount)",
  "function CouponAlreadyRedeemed(uint256 _couponId) view returns (bool)",
  "function GetCouponOwner(uint256 _couponId) view returns (address)",
  "function GetCouponStatus(uint256 _couponId) view returns (uint8)",
  "event CouponCreated(uint256 indexed couponId, address indexed merchant, bytes32 couponHash, uint256 expiry, uint256 cashbackAmount)",
  "event CouponClaimed(uint256 indexed couponId, address indexed customer, uint256 timestamp)",
  "event CouponRedeemed(uint256 indexed couponId, address indexed merchant, address indexed customer, uint256 redemptionTimestamp, uint256 cashbackAmount)",
  "event CashbackIssued(uint256 indexed couponId, address indexed customer, uint256 amount, uint256 timestamp)"
];

export const HARDHAT_CHAIN_ID = "0x7a69"; // 31337

export async function requestAccount() {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed. Please install MetaMask to interact with the decentralized blockchain.");
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  return accounts[0];
}

export async function getWeb3ProviderAndSigner() {
  if (typeof window.ethereum === "undefined") return { provider: null, signer: null };
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
}

export function getContract(contractAddress, signerOrProvider) {
  return new ethers.Contract(contractAddress, DEFAULT_ABI, signerOrProvider);
}

export function generateClientHash(couponId, code, merchantWallet, discountValue, expiryTimestamp) {
  const packed = ethers.solidityPacked(
    ["uint256", "string", "address", "uint256", "uint256"],
    [couponId, code.toUpperCase().trim(), merchantWallet.toLowerCase(), discountValue, expiryTimestamp]
  );
  return ethers.keccak256(packed);
}
