const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

class BlockchainService {
  constructor() {
    this.rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.contractAddress = process.env.CONTRACT_ADDRESS || null;
    this.contract = null;
    this.contractAbi = null;
    this.signer = null;

    this.initializeContract();
  }

  initializeContract() {
    try {
      const deploymentPath = path.join(__dirname, "..", "config", "contractDeployment.json");
      if (fs.existsSync(deploymentPath)) {
        const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
        this.contractAddress = this.contractAddress || deploymentData.address;
        this.contractAbi = deploymentData.abi;
      }

      if (this.contractAddress && this.contractAbi) {
        // Setup backend admin signer if private key is supplied
        if (process.env.ADMIN_PRIVATE_KEY) {
          this.signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
          this.contract = new ethers.Contract(this.contractAddress, this.contractAbi, this.signer);
        } else {
          this.contract = new ethers.Contract(this.contractAddress, this.contractAbi, this.provider);
        }
        console.log(`[Blockchain Service] Connected to contract at ${this.contractAddress}`);
      } else {
        console.warn(`[Blockchain Service] Contract address or ABI not yet configured. Run Hardhat deploy.`);
      }
    } catch (err) {
      console.warn(`[Blockchain Service] Notice: Could not automatically load contract: ${err.message}`);
    }
  }

  /**
   * Generates deterministic Keccak256 hash for coupon tamper prevention
   */
  generateCouponHash(couponId, code, merchantWallet, discountValue, expiryTimestamp) {
    const packed = ethers.solidityPacked(
      ["uint256", "string", "address", "uint256", "uint256"],
      [couponId, code.toUpperCase().trim(), merchantWallet.toLowerCase(), discountValue, expiryTimestamp]
    );
    return ethers.keccak256(packed);
  }

  /**
   * Verifies an Ethereum signed message (EIP-191) against claimed address
   */
  verifySignature(message, signature, expectedAddress) {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (err) {
      console.error("[Signature Verification Error]", err);
      return false;
    }
  }

  /**
   * Queries on-chain coupon verification status
   */
  async verifyCouponOnChain(couponId, couponHash) {
    if (!this.contract) {
      throw new Error("Contract not initialized");
    }
    const result = await this.contract.VerifyCoupon(couponId, couponHash);
    return {
      isValid: result.isValid,
      statusCode: Number(result.statusCode),
      customer: result.customer,
      expiry: Number(result.expiry),
      cashbackAmountWei: result.cashbackAmount.toString(),
    };
  }

  /**
   * Queries if a coupon is already redeemed on chain
   */
  async isCouponRedeemedOnChain(couponId) {
    if (!this.contract) {
      return false;
    }
    return await this.contract.CouponAlreadyRedeemed(couponId);
  }

  /**
   * Reads on-chain status
   */
  async getCouponStatusOnChain(couponId) {
    if (!this.contract) {
      return 0;
    }
    const status = await this.contract.GetCouponStatus(couponId);
    return Number(status);
  }

  /**
   * Fetch current network block number
   */
  async getLatestBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      return 0;
    }
  }
}

module.exports = new BlockchainService();
