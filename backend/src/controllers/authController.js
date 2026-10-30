const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Merchant = require("../models/Merchant");
const Admin = require("../models/Admin");
const WalletMapping = require("../models/WalletMapping");
const blockchainService = require("../services/blockchainService");
const { JWT_SECRET } = require("../middleware/auth");

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new customer or merchant
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, walletAddress, businessName, registrationNumber, category } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "An account with this email already exists" });
    }

    const assignedRole = role === "merchant" ? "merchant" : "customer";

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      walletAddress: walletAddress ? walletAddress.toLowerCase() : null,
    });

    // If merchant, initialize Merchant entity
    if (assignedRole === "merchant") {
      await Merchant.create({
        userId: user._id,
        businessName: businessName || name + " Enterprise",
        registrationNumber: registrationNumber || "REG-" + Date.now(),
        category: category || "Retail & E-Commerce",
        contactEmail: email,
        walletAddress: walletAddress ? walletAddress.toLowerCase() : "0x0000000000000000000000000000000000000000",
        approvalStatus: "approved", // Auto-approved for frictionless demo/evaluation
        isApproved: true,
        approvedAt: new Date(),
      });
    }

    // Link wallet mapping if address supplied
    if (walletAddress) {
      await WalletMapping.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        {
          walletAddress: walletAddress.toLowerCase(),
          userId: user._id,
          role: assignedRole,
          isVerified: true,
          lastVerifiedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        rewardBalance: user.rewardBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user via email & password
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide an email and password" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ success: false, message: "Account is suspended. Please contact administrator." });
    }

    const token = generateToken(user._id);

    let merchantInfo = null;
    if (user.role === "merchant") {
      merchantInfo = await Merchant.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        rewardBalance: user.rewardBalance,
        merchantProfile: merchantInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request cryptographic Nonce for MetaMask Web3 Login
// @route   POST /api/auth/nonce
// @access  Public
exports.requestNonce = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: "Wallet address is required" });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const nonce = `Sign this secure message to authenticate with Decentralized Coupon System: ${Math.floor(
      Math.random() * 10000000
    )} at ${Date.now()}`;

    let mapping = await WalletMapping.findOne({ walletAddress: normalizedAddress });
    if (!mapping) {
      mapping = new WalletMapping({
        walletAddress: normalizedAddress,
        nonce,
        role: "customer",
      });
    } else {
      mapping.nonce = nonce;
    }
    await mapping.save();

    res.status(200).json({
      success: true,
      walletAddress: normalizedAddress,
      nonce,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify MetaMask signature & authenticate
// @route   POST /api/auth/verify-signature
// @access  Public
exports.verifySignature = async (req, res, next) => {
  try {
    const { walletAddress, signature, role } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({ success: false, message: "Wallet address and signature are required" });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const mapping = await WalletMapping.findOne({ walletAddress: normalizedAddress });

    if (!mapping || !mapping.nonce) {
      return res.status(400).json({ success: false, message: "No active authentication challenge found for wallet" });
    }

    // Cryptographic signature recovery via ethers.js
    const isValid = blockchainService.verifySignature(mapping.nonce, signature, normalizedAddress);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Cryptographic signature verification failed" });
    }

    // Refresh nonce to prevent replay attacks
    mapping.nonce = `EXPIRED-${Date.now()}`;
    mapping.isVerified = true;
    mapping.lastVerifiedAt = new Date();
    mapping.lastSignature = signature;

    // Find or create user
    let user = await User.findOne({ walletAddress: normalizedAddress });
    if (!user) {
      const assignedRole = role === "merchant" ? "merchant" : "customer";
      user = await User.create({
        name: `Web3 User ${normalizedAddress.substring(0, 6)}`,
        email: `${normalizedAddress.substring(0, 8)}@web3coupons.network`,
        password: "Web3RandomPassword-" + Math.random().toString(36),
        walletAddress: normalizedAddress,
        role: assignedRole,
      });

      if (assignedRole === "merchant") {
        await Merchant.create({
          userId: user._id,
          businessName: "Web3 Merchant " + normalizedAddress.substring(0, 6),
          registrationNumber: "W3REG-" + Date.now(),
          category: "Decentralized Commerce",
          contactEmail: user.email,
          walletAddress: normalizedAddress,
          isApproved: true,
          approvalStatus: "approved",
          approvedAt: new Date(),
        });
      }
    }

    mapping.userId = user._id;
    await mapping.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        rewardBalance: user.rewardBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "claimedCoupons.coupon",
      select: "title code discountValue discountType expiryDate status cashbackAmountEth merchantWallet",
    });

    let merchant = null;
    if (user.role === "merchant") {
      merchant = await Merchant.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        rewardBalance: user.rewardBalance,
        claimedCoupons: user.claimedCoupons,
        merchantProfile: merchant,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & link wallet
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, walletAddress } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (walletAddress) {
      user.walletAddress = walletAddress.toLowerCase();
      await WalletMapping.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        {
          walletAddress: walletAddress.toLowerCase(),
          userId: user._id,
          role: user.role,
          isVerified: true,
        },
        { upsert: true }
      );
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        rewardBalance: user.rewardBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};
