# CouponChain: Blockchain-Based Digital Coupon & Cashback Redemption System

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22.5-yellow?logo=ethereum)](https://hardhat.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, decentralized promotional coupon and cashback settlement platform. Built with an optimized **hybrid Web3 architecture**: Solidity smart contracts enforce atomic single-redemptions, cryptographic Keccak256 tamper-proofing, and automated ETH cashback escrow disbursements, while MongoDB powers high-throughput off-chain metadata, user management, and analytics.

---

## Project Objectives & Key Blockchain Advantages

1. **Zero Double-Redemption:** Solidity smart contract tracks state (`Active -> Claimed -> Redeemed`) with atomic execution and `ReentrancyGuard`, making duplicate redemptions cryptographically impossible.
2. **Cryptographic Tamper Prevention:** Each coupon has a Keccak256 hash of `(couponId, code, merchantWallet, discountValue, expiryTimestamp)` anchored on-chain. Any tampering with terms or discounts causes instant verification failure.
3. **Automated Cashback Escrow:** Cashback amounts (in ETH/Wei) are recorded and disbursed directly to claimed customer wallets immediately upon verified redemption.
4. **Optimized Hybrid Model:** Blockchain is used strictly where it offers true mathematical trust; images, descriptions, and audit logs reside in MongoDB to ensure zero gas wastage.

---

## Complete Project Folder Structure

```
c:\bct\
├── contracts\                   # Solidity Smart Contracts & Hardhat Environment
│   ├── contracts\
│   │   └── CouponCashbackSystem.sol  # Core Smart Contract (Issue, Claim, Redeem, Cashback)
│   ├── scripts\
│   │   └── deploy.js                 # Automated Hardhat Deployment & Config Exporter
│   ├── test\
│   │   └── CouponCashbackSystem.test.js # 15 Comprehensive Mocha/Chai Unit Tests
│   ├── hardhat.config.js             # Hardhat EVM Configuration (Paris / 0.8.24)
│   └── package.json
│
├── backend\                     # Node.js / Express REST API Gateway
│   ├── src\
│   │   ├── config\
│   │   │   ├── db.js                 # MongoDB Connection Manager
│   │   │   └── contractDeployment.json # Synced ABI & Deployed Contract Address
│   │   ├── models\                   # 9 Mongoose Schema Models
│   │   │   ├── User.js               # Customer, Merchant, Admin identities & passwords
│   │   │   ├── Merchant.js           # Business registration & verification state
│   │   │   ├── Coupon.js             # Cryptographic coupon records & hashes
│   │   │   ├── Cashback.js           # Cashback disbursement records
│   │   │   ├── Transaction.js        # Immutable on-chain transaction ledger
│   │   │   ├── Category.js           # Promotional category taxonomy
│   │   │   ├── Admin.js              # Governance permissions & platform rates
│   │   │   ├── WalletMapping.js      # Nonce-based Web3 signature mappings
│   │   │   └── AuditLog.js           # Security audit trails (IP, userAgent, actions)
│   │   ├── controllers\              # REST API Controllers
│   │   │   ├── authController.js     # JWT & MetaMask EIP-191 personal sign auth
│   │   │   ├── merchantController.js # Coupon issuance, POS verifier & redemptions
│   │   │   ├── customerController.js # Marketplace browsing, claims & cashback history
│   │   │   ├── adminController.js    # Merchant approvals, user status & audit logs
│   │   │   └── analyticsController.js# Daily redemptions, sales & fraud analytics
│   │   ├── routes\                   # Modular Express Routers
│   │   ├── middleware\               # JWT protect, Role Authorize, Audit & Error Handlers
│   │   ├── services\
│   │   │   └── blockchainService.js  # Ethers.js JSON-RPC integration & hash engine
│   │   ├── seeds\
│   │   │   └── seed.js               # Realistic initial database seed
│   │   └── server.js                 # Express Application Entry Point
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── frontend\                    # Modern React.js (Vite) Web3 Application
│   ├── src\
│   │   ├── components\               # Reusable UI & Glassmorphism Components
│   │   │   ├── Navbar.jsx            # Dynamic navbar, wallet status, role switcher
│   │   │   ├── Sidebar.jsx           # Dashboard navigation drawer
│   │   │   ├── Footer.jsx            # Startup footer & network indicators
│   │   │   ├── CouponCard.jsx        # Glassmorphic coupon card with badges
│   │   │   ├── StatsCard.jsx         # Metric card with visual trend pills
│   │   │   └── RedeemModal.jsx       # QR presentation & 1-click Web3 redemption
│   │   ├── context\
│   │   │   ├── AuthContext.jsx       # JWT & Web3 login state
│   │   │   ├── Web3Context.jsx       # MetaMask provider, signer & contract instance
│   │   │   └── ThemeContext.jsx      # Dark / Light mode manager
│   │   ├── pages\                    # Application Views
│   │   │   ├── LandingPage.jsx       # Hero, live marketplace & workflow visualizer
│   │   │   ├── LoginPage.jsx         # Credentials & 1-Click MetaMask sign-in
│   │   │   ├── RegisterPage.jsx      # Role selector (Customer vs Merchant)
│   │   │   ├── CustomerDashboard.jsx # Vouchers, wallet balance & recent cashbacks
│   │   │   ├── MerchantDashboard.jsx # POS Verifier, coupon issuer & analytics
│   │   │   ├── AdminDashboard.jsx    # Merchant approvals, user control & ledger
│   │   │   ├── CouponsPage.jsx       # Search, filter pills & claim actions
│   │   │   ├── CouponDetailsPage.jsx # Full terms, issuer wallet & on-chain hash
│   │   │   ├── WalletPage.jsx        # Customer's claimed coupon vault
│   │   │   ├── CashbackHistoryPage.jsx # Lifetime cashback rewards table
│   │   │   ├── AnalyticsPage.jsx     # Visual charts & fraud detection metrics
│   │   │   ├── ProfilePage.jsx       # User credentials & wallet linking
│   │   │   ├── SettingsPage.jsx      # Smart contract & RPC node status
│   │   │   └── NotFoundPage.jsx      # 404 handler
│   │   ├── services\                 # Axios API & Ethers Web3 Helper
│   │   ├── contracts\
│   │   │   └── contractDeployment.json # Auto-synced contract address & ABI
│   │   ├── App.jsx                   # Role-guarded route definitions
│   │   ├── main.jsx                  # React DOM Root
│   │   └── index.css                 # Custom glassmorphism & Tailwind utilities
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── docs\                        # Academic Project Report & API Specifications
    ├── PROJECT_REPORT.md             # Complete academic thesis with 9 Mermaid diagrams
    └── SWAGGER_API_DOCS.json         # OpenAPI 3.0 REST Specification
```

---

## Quick Start & Installation Guide

### Prerequisites
- **Node.js** (v18+ or v22.x recommended)
- **MongoDB** running locally on port 27017 or a MongoDB Atlas URI
- **MetaMask** browser extension (optional, simulated fallback included)

---

### Step 1: Smart Contracts (Compile & Test)

```powershell
cd c:\bct\contracts
npm install
npx hardhat compile
npx hardhat test
```
*Expected: 15 passing unit tests.*

To deploy to local Hardhat node or generate configuration:
```powershell
npx hardhat run scripts/deploy.js
```
*This automatically deploys the contract and exports `contractDeployment.json` to both `backend/src/config` and `frontend/src/contracts`.*

---

### Step 2: Backend REST API Setup & Database Seed

```powershell
cd c:\bct\backend
npm install
npm run seed
npm start
```
*The API gateway runs at `http://localhost:5000`.*

---

### Step 3: Frontend Web3 Application

```powershell
cd c:\bct\frontend
npm install
npm run dev
```
*The application will launch at `http://localhost:5173`.*

---

## Pre-Configured Demo Accounts (1-Click Login)

The system includes pre-seeded demo accounts for instant evaluation:

| Role | Email | Password | Pre-Configured Wallet | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin@couponchain.io` | `AdminPassword123!` | `0xf39fd...2266` (Hardhat #0) | Merchant approval, ledger monitor, user suspension |
| **Merchant** | `cybertech@merchant.io` | `MerchantPassword123!` | `0x70997...79c8` (Hardhat #1) | Issue coupons, POS barcode scanner & verifier |
| **Customer** | `alice@customer.io` | `CustomerPassword123!` | `0x90f79...b906` (Hardhat #3) | Claim vouchers, present QR pass, earn ETH cashback |

*Note: You can also click the quick-fill buttons on the Login page for 1-click credential population.*

---

## Smart Contract Functions Reference

| Function Signature | Description |
| :--- | :--- |
| `CreateCoupon(uint256 id, bytes32 hash, uint256 expiry, uint256 cashback)` | Issues coupon hash to blockchain; merchant funds cashback pool |
| `ClaimCoupon(uint256 id)` | Binds coupon ownership to caller's customer wallet address |
| `VerifyCoupon(uint256 id, bytes32 checkHash)` | Returns validity boolean, status code, customer wallet, and cashback reward |
| `RedeemCoupon(uint256 id, bytes32 verificationHash)` | Verifies hash, marks state as Redeemed, and automatically transfers ETH cashback |
| `RecordCashback(uint256 id)` | Explicit cashback payout method with duplicate-payment protection |
| `CouponAlreadyRedeemed(uint256 id)` | Public view returning whether coupon was previously redeemed |
| `GetCouponOwner(uint256 id)` | Returns claimed customer wallet address |
| `GetCouponStatus(uint256 id)` | Returns status: `NonExistent (0)`, `Active (1)`, `Claimed (2)`, `Redeemed (3)`, `Expired (4)` |

---

## Academic Documentation & Mermaid Diagrams

Full formal documentation is located in [`docs/PROJECT_REPORT.md`](file:///c:/bct/docs/PROJECT_REPORT.md), featuring:
1. System Architecture Diagram
2. Entity-Relationship (ER) Diagram
3. Blockchain Workflow Diagram
4. Sequence Diagram (Claim & Redeem)
5. Use Case Diagram
6. Data Flow Diagram (DFD Level 0 & Level 1)
7. Class Diagram
8. Activity Diagram
9. Deployment Diagram
10. OpenAPI 3.0 / Swagger JSON specification

---

## License
MIT License. Built for academic research and startup software engineering demonstration.
#   B l o c k c h a i n - B a s e d - D i g i t a l - C o u p o n - C a s h b a c k - R e d e m p t i o n - S y s t e m  
 