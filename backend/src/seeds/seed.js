const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { ethers } = require("ethers");
const connectDB = require("../config/db");

const User = require("../models/User");
const Merchant = require("../models/Merchant");
const Coupon = require("../models/Coupon");
const Cashback = require("../models/Cashback");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Admin = require("../models/Admin");
const WalletMapping = require("../models/WalletMapping");
const AuditLog = require("../models/AuditLog");
const blockchainService = require("../services/blockchainService");

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    console.log("[Seed] Clearing existing collections...");

    await Promise.all([
      User.deleteMany({}),
      Merchant.deleteMany({}),
      Coupon.deleteMany({}),
      Cashback.deleteMany({}),
      Transaction.deleteMany({}),
      Category.deleteMany({}),
      Admin.deleteMany({}),
      WalletMapping.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log("[Seed] Populating Categories...");
    const categories = await Category.create([
      { name: "Electronics & Tech", slug: "electronics", icon: "Laptop", description: "Smartphones, laptops, accessories & smart gadgets", couponCount: 4 },
      { name: "Fashion & Apparel", slug: "fashion", icon: "Shirt", description: "Designer clothing, sneakers, luxury bags and accessories", couponCount: 3 },
      { name: "Food & Dining", slug: "food-dining", icon: "Utensils", description: "Gourmet restaurants, organic cafes and coffee shops", couponCount: 2 },
      { name: "Travel & Hotels", slug: "travel", icon: "Plane", description: "Flight discounts, luxury hotel stays and vacation escapes", couponCount: 2 },
      { name: "Gaming & Metaverse", slug: "gaming", icon: "Gamepad2", description: "Web3 games, consoles, hardware and digital assets", couponCount: 1 },
      { name: "Health & Beauty", slug: "health-beauty", icon: "Sparkles", description: "Wellness, skincare, fitness gear and spa retreats", couponCount: 2 },
    ]);

    console.log("[Seed] Creating Admin Account...");
    const adminUser = await User.create({
      name: "System Super Admin",
      email: "admin@couponchain.io",
      password: "AdminPassword123!",
      role: "admin",
      walletAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", // Hardhat Account #0
      status: "active",
      rewardBalance: 0,
    });

    await Admin.create({
      userId: adminUser._id,
      adminLevel: "SUPER_ADMIN",
      permissions: ["MANAGE_MERCHANTS", "MANAGE_COUPONS", "MANAGE_USERS", "PAUSE_CONTRACT", "VIEW_AUDIT"],
    });

    console.log("[Seed] Creating Sample Merchants...");
    const merchantUser1 = await User.create({
      name: "CyberTech Electronics",
      email: "cybertech@merchant.io",
      password: "MerchantPassword123!",
      role: "merchant",
      walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", // Hardhat Account #1
      status: "active",
    });

    const merchant1 = await Merchant.create({
      userId: merchantUser1._id,
      businessName: "CyberTech Electronics Inc.",
      registrationNumber: "REG-US-992102",
      category: "Electronics & Tech",
      description: "Premier decentralized consumer electronics and gadgets vendor.",
      contactEmail: "support@cybertech.io",
      phone: "+1 (555) 234-5678",
      website: "https://cybertech-store.io",
      walletAddress: merchantUser1.walletAddress,
      approvalStatus: "approved",
      isApproved: true,
      approvedAt: new Date(),
      approvedBy: adminUser._id,
      logoUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=300&q=80",
    });

    const merchantUser2 = await User.create({
      name: "Aura Luxury Apparel",
      email: "aura@merchant.io",
      password: "MerchantPassword123!",
      role: "merchant",
      walletAddress: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", // Hardhat Account #2
      status: "active",
    });

    const merchant2 = await Merchant.create({
      userId: merchantUser2._id,
      businessName: "Aura Luxury Wear",
      registrationNumber: "REG-EU-881903",
      category: "Fashion & Apparel",
      description: "Sustainable high-fashion streetwear with verifiable blockchain incentives.",
      contactEmail: "concierge@aurawear.com",
      walletAddress: merchantUser2.walletAddress,
      approvalStatus: "approved",
      isApproved: true,
      approvedAt: new Date(),
      approvedBy: adminUser._id,
      logoUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80",
    });

    console.log("[Seed] Creating Customer Accounts...");
    const customerUser1 = await User.create({
      name: "Alice Johnson",
      email: "alice@customer.io",
      password: "CustomerPassword123!",
      role: "customer",
      walletAddress: "0x90f79bf6eb2c4f870365e785982e1f101e93b906", // Hardhat Account #3
      rewardBalance: 0.08,
      status: "active",
    });

    const customerUser2 = await User.create({
      name: "Bob Martinez",
      email: "bob@customer.io",
      password: "CustomerPassword123!",
      role: "customer",
      walletAddress: "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65", // Hardhat Account #4
      rewardBalance: 0.03,
      status: "active",
    });

    console.log("[Seed] Creating Cryptographic Coupons...");
    const expiry30Days = new Date(Date.now() + 30 * 86400 * 1000);
    const expiryTimestamp = Math.floor(expiry30Days.getTime() / 1000);

    const coupon1Hash = blockchainService.generateCouponHash(
      200101,
      "TECHSAVE25",
      merchant1.walletAddress,
      25,
      expiryTimestamp
    );

    const coupon1 = await Coupon.create({
      couponId: 200101,
      merchantId: merchant1._id,
      merchantWallet: merchant1.walletAddress,
      title: "25% OFF Ultra OLED Monitors & Laptops",
      description: "Enjoy verified 25% discount on all pro series hardware plus direct 0.05 ETH cashback directly into your Web3 wallet upon redemption.",
      code: "TECHSAVE25",
      category: "Electronics & Tech",
      discountType: "percentage",
      discountValue: 25,
      minimumPurchase: 200,
      maxDiscount: 150,
      cashbackAmountEth: 0.05,
      cashbackAmountWei: ethers.parseEther("0.05").toString(),
      expiryDate: expiry30Days,
      couponHash: coupon1Hash,
      onChainTxHash: "0x" + Math.random().toString(16).substring(2, 66),
      blockNumber: 120401,
      imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80",
      status: "active",
    });

    const coupon2Hash = blockchainService.generateCouponHash(
      200102,
      "AURA40VIP",
      merchant2.walletAddress,
      40,
      expiryTimestamp
    );

    const coupon2 = await Coupon.create({
      couponId: 200102,
      merchantId: merchant2._id,
      merchantWallet: merchant2.walletAddress,
      title: "40% OFF Luxury Summer Collection",
      description: "Exclusive Web3 VIP voucher offering 40% off designer apparel and 0.03 ETH instant smart contract cashback reward.",
      code: "AURA40VIP",
      category: "Fashion & Apparel",
      discountType: "percentage",
      discountValue: 40,
      minimumPurchase: 100,
      maxDiscount: 200,
      cashbackAmountEth: 0.03,
      cashbackAmountWei: ethers.parseEther("0.03").toString(),
      expiryDate: expiry30Days,
      couponHash: coupon2Hash,
      onChainTxHash: "0x" + Math.random().toString(16).substring(2, 66),
      blockNumber: 120405,
      imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
      status: "active",
    });

    // Create a coupon claimed by Alice
    const coupon3Hash = blockchainService.generateCouponHash(
      200103,
      "COFFEEPRO15",
      merchant1.walletAddress,
      15,
      expiryTimestamp
    );

    const coupon3 = await Coupon.create({
      couponId: 200103,
      merchantId: merchant1._id,
      merchantWallet: merchant1.walletAddress,
      title: "15% OFF Smart Home Gadgets & Sensors",
      description: "Claimed by Alice. Ready to be presented at merchant checkout or redeemed via on-chain proof.",
      code: "COFFEEPRO15",
      category: "Electronics & Tech",
      discountType: "percentage",
      discountValue: 15,
      minimumPurchase: 50,
      maxDiscount: 30,
      cashbackAmountEth: 0.02,
      cashbackAmountWei: ethers.parseEther("0.02").toString(),
      expiryDate: expiry30Days,
      couponHash: coupon3Hash,
      onChainTxHash: "0x" + Math.random().toString(16).substring(2, 66),
      blockNumber: 120408,
      status: "claimed",
      claimedBy: customerUser1._id,
      claimedByWallet: customerUser1.walletAddress,
      claimedAt: new Date(Date.now() - 3600 * 1000 * 12),
      imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80",
    });

    // Create an already Redeemed coupon to test double-redemption prevention
    const coupon4Hash = blockchainService.generateCouponHash(
      200104,
      "REDEEMEDPAST50",
      merchant2.walletAddress,
      50,
      expiryTimestamp
    );

    const coupon4 = await Coupon.create({
      couponId: 200104,
      merchantId: merchant2._id,
      merchantWallet: merchant2.walletAddress,
      title: "50% OFF Winter Clearance (Redeemed)",
      description: "Successfully redeemed coupon with verifiable on-chain record and paid cashback.",
      code: "REDEEMEDPAST50",
      category: "Fashion & Apparel",
      discountType: "percentage",
      discountValue: 50,
      minimumPurchase: 120,
      maxDiscount: 100,
      cashbackAmountEth: 0.05,
      cashbackAmountWei: ethers.parseEther("0.05").toString(),
      expiryDate: expiry30Days,
      couponHash: coupon4Hash,
      onChainTxHash: "0x" + Math.random().toString(16).substring(2, 66),
      blockNumber: 120410,
      status: "redeemed",
      claimedBy: customerUser1._id,
      claimedByWallet: customerUser1.walletAddress,
      claimedAt: new Date(Date.now() - 86400 * 1000 * 2),
      redeemedAt: new Date(Date.now() - 86400 * 1000),
      redeemedByWallet: customerUser1.walletAddress,
      redemptionTxHash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
      imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80",
    });

    // Create Cashback Record for coupon4
    await Cashback.create({
      cashbackId: "CB-200104-HISTORIC",
      couponId: coupon4.couponId,
      couponRef: coupon4._id,
      customerId: customerUser1._id,
      customerWallet: customerUser1.walletAddress,
      merchantId: merchant2._id,
      merchantWallet: merchant2.walletAddress,
      amountWei: coupon4.cashbackAmountWei,
      amountEth: coupon4.cashbackAmountEth,
      amountUSD: 175.0,
      blockchainTxHash: coupon4.redemptionTxHash,
      blockNumber: 120420,
      status: "processed",
      issuedAt: coupon4.redeemedAt,
    });

    // Transactions for activity stream
    await Transaction.create([
      {
        txId: "TX-INIT-01",
        type: "COUPON_CREATE",
        couponId: 200101,
        merchantWallet: merchant1.walletAddress,
        blockchainTxHash: coupon1.onChainTxHash,
        status: "CONFIRMED",
        payload: { title: coupon1.title, cashbackEth: 0.05 },
      },
      {
        txId: "TX-INIT-02",
        type: "COUPON_CREATE",
        couponId: 200102,
        merchantWallet: merchant2.walletAddress,
        blockchainTxHash: coupon2.onChainTxHash,
        status: "CONFIRMED",
        payload: { title: coupon2.title, cashbackEth: 0.03 },
      },
      {
        txId: "TX-INIT-03",
        type: "COUPON_CLAIM",
        couponId: 200103,
        userWallet: customerUser1.walletAddress,
        merchantWallet: merchant1.walletAddress,
        blockchainTxHash: "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
        status: "CONFIRMED",
        payload: { title: coupon3.title },
      },
      {
        txId: "TX-INIT-04",
        type: "COUPON_REDEEM",
        couponId: 200104,
        userWallet: customerUser1.walletAddress,
        merchantWallet: merchant2.walletAddress,
        blockchainTxHash: coupon4.redemptionTxHash,
        status: "CONFIRMED",
        payload: { title: coupon4.title, cashbackEth: 0.05 },
      },
    ]);

    // Initial audit log entries
    await AuditLog.create([
      {
        userId: adminUser._id,
        userRole: "admin",
        action: "SYSTEM_INITIALIZE",
        resource: "SEED_DATABASE",
        status: "SUCCESS",
        details: { message: "System initialized with initial production seed data" },
      },
      {
        userId: merchantUser1._id,
        userRole: "merchant",
        action: "MERCHANT_VERIFICATION",
        resource: "MERCHANT",
        status: "SUCCESS",
        details: { businessName: merchant1.businessName, verifiedBy: "Admin" },
      },
    ]);

    console.log("==================================================");
    console.log("Database Seed completed successfully!");
    console.log("Admin Account:    admin@couponchain.io / AdminPassword123!");
    console.log("Merchant Account: cybertech@merchant.io / MerchantPassword123!");
    console.log("Customer Account: alice@customer.io / CustomerPassword123!");
    console.log("==================================================");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();
