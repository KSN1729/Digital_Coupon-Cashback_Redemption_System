# Academic Project Report
## Blockchain-Based Digital Coupon & Cashback Redemption System

---

### Executive Summary & Abstract

Traditional promotional coupon and loyalty reward systems suffer from systemic vulnerabilities including **double redemption, coupon counterfeiting, unauthorized coupon modification, and delayed cashback disbursement**. Centralized database solutions often introduce single points of failure, lack transparent verification between independent merchants and customers, and remain vulnerable to insider tampering.

This project designs, engineers, and verifies a **Decentralized Digital Coupon & Cashback Redemption System (CouponChain)**. The platform implements an **enterprise-grade hybrid Web3 architecture**:
1. **Decentralized Layer (Ethereum / Solidity):** Used strictly where blockchain delivers tangible advantages—state immutability, atomic single-redemption transitions, cryptographic Keccak256 hash anchoring, and trustless, automated cryptocurrency cashback escrow transfers.
2. **Centralized Data Layer (MongoDB & Node.js/Express):** High-throughput off-chain storage for rich coupon metadata (promotional banners, terms, descriptions, user demographics, audit trails, and analytical aggregations).
3. **Decentralized Frontend (React, Vite, Tailwind CSS, Ethers.js, MetaMask):** Modern glassmorphic Web3 user experience providing role-separated customer, merchant, and administrator consoles.

---

### System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (React.js + Tailwind CSS)"]
        UI_Customer["Customer Portal (Browse, Vault, Claim, Redeem)"]
        UI_Merchant["Merchant Station (Issue, POS Scanner, Analytics)"]
        UI_Admin["Admin Governance (Approvals, Ledger, Audit)"]
        MetaMask["MetaMask Wallet (EIP-1193 / EIP-191 Signer)"]
    end

    subgraph APILayer ["Backend API Gateway (Node.js + Express)"]
        AuthModule["JWT & Nonce Auth Controller"]
        MerchantModule["Merchant Controller & On-Chain Hashing"]
        CustomerModule["Customer Claims & Verification"]
        AdminModule["Admin Governance & Audit Logger"]
        BlockchainSvc["Ethers.js Blockchain RPC Service"]
    end

    subgraph DataLayer ["Data Storage (MongoDB Cluster)"]
        UsersCol[("Users")]
        MerchantsCol[("Merchants")]
        CouponsCol[("Coupons")]
        CashbacksCol[("Cashbacks")]
        TransactionsCol[("Transactions")]
        AuditLogsCol[("AuditLogs")]
    end

    subgraph BlockchainLayer ["Decentralized Settlement (Solidity 0.8.24)"]
        SmartContract["CouponCashbackSystem.sol"]
        StateRegistry["State Registry (Active, Claimed, Redeemed)"]
        HashAnchoring["Keccak256 Coupon Hash Verifier"]
        CashbackPool["ETH Cashback Escrow Vault"]
    end

    UI_Customer -->|HTTP / JWT| CustomerModule
    UI_Merchant -->|HTTP / JWT| MerchantModule
    UI_Admin -->|HTTP / JWT| AdminModule
    MetaMask -->|Sign / Broadcast Tx| SmartContract

    CustomerModule --> DataLayer
    MerchantModule --> DataLayer
    AdminModule --> DataLayer

    MerchantModule --> BlockchainSvc
    CustomerModule --> BlockchainSvc
    BlockchainSvc -->|JSON-RPC Provider| SmartContract
    SmartContract --> StateRegistry
    SmartContract --> HashAnchoring
    SmartContract --> CashbackPool
```

---

### Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ MERCHANTS : "owns"
    USERS ||--o{ WALLET_MAPPINGS : "authenticates_via"
    USERS ||--o{ CASHBACKS : "earns"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    MERCHANTS ||--o{ COUPONS : "issues"
    MERCHANTS ||--o{ CASHBACKS : "funds"
    COUPONS ||--o{ CASHBACKS : "yields"
    COUPONS ||--o{ TRANSACTIONS : "generates"
    CATEGORIES ||--o{ COUPONS : "categorizes"
    ADMIN ||--o{ AUDIT_LOGS : "inspects"

    USERS {
        ObjectId _id PK
        string name
        string email UK
        string password
        string walletAddress
        string role
        string status
        number rewardBalance
        date createdAt
    }

    MERCHANTS {
        ObjectId _id PK
        ObjectId userId FK
        string businessName
        string registrationNumber UK
        string category
        string walletAddress
        string approvalStatus
        boolean isApproved
        number totalCouponsCreated
        number totalRedemptions
    }

    COUPONS {
        ObjectId _id PK
        number couponId UK
        ObjectId merchantId FK
        string merchantWallet
        string title
        string code
        string category
        number discountValue
        number cashbackAmountEth
        string couponHash UK
        string status
        ObjectId claimedBy FK
        string claimedByWallet
        string onChainTxHash
        date expiryDate
    }

    CASHBACKS {
        ObjectId _id PK
        string cashbackId UK
        number couponId
        ObjectId customerId FK
        string customerWallet
        ObjectId merchantId FK
        number amountEth
        number amountUSD
        string blockchainTxHash UK
        string status
        date issuedAt
    }

    TRANSACTIONS {
        ObjectId _id PK
        string txId UK
        string type
        number couponId
        string userWallet
        string merchantWallet
        string blockchainTxHash UK
        string status
        date createdAt
    }

    CATEGORIES {
        ObjectId _id PK
        string name UK
        string slug UK
        string icon
        boolean isActive
    }

    WALLET_MAPPINGS {
        ObjectId _id PK
        string walletAddress UK
        ObjectId userId FK
        string nonce
        boolean isVerified
        date lastVerifiedAt
    }

    AUDIT_LOGS {
        ObjectId _id PK
        ObjectId userId FK
        string userRole
        string action
        string resource
        string status
        string ipAddress
        date timestamp
    }
```

---

### Blockchain Workflow Diagram

```mermaid
flowchart LR
    A["Merchant Creates Coupon"] -->|1. Off-Chain Metadata| B["Store in MongoDB"]
    B -->|2. Compute Keccak256 Hash| C["Deploy Hash to Smart Contract"]
    C -->|3. Event: CouponCreated| D["State: Active on Blockchain"]
    D -->|4. Customer Connects MetaMask| E["Customer Claims Coupon"]
    E -->|5. Smart Contract Binding| F["State: Claimed (Bound to Customer Wallet)"]
    F -->|6. Checkout Presentation| G["POS Verifier Checks Hash & Expiry"]
    G -->|7. Verified Presentation| H["Smart Contract RedeemCoupon()"]
    H -->|8. Atomic State Transition| I["State: Redeemed (Locks Reentrancy)"]
    I -->|9. Escrow Disbursement| J["Direct ETH Cashback to Customer"]
    J -->|10. Ledger Update| K["Transaction & Cashback Recorded"]
```

---

### Sequence Diagram: End-to-End Claim and Redemption

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    actor Merchant
    participant Frontend as React Client
    participant Backend as Express API Gateway
    participant DB as MongoDB
    participant Contract as CouponCashbackSystem.sol

    Note over Merchant,Contract: Coupon Issuance
    Merchant->>Frontend: Enter Coupon Details (Code, Discount, Cashback, Expiry)
    Frontend->>Backend: POST /api/merchants/coupons
    Backend->>Backend: Calculate Keccak256 Hash
    Backend->>DB: Save Coupon (Status: Active)
    Backend-->>Frontend: Return Coupon ID + Hash
    Merchant->>Contract: MetaMask calls CreateCoupon(id, hash, expiry, cashback)
    Contract-->>Contract: Anchor Hash & Emit CouponCreated Event

    Note over Customer,Contract: Coupon Claiming
    Customer->>Frontend: Click "Claim Coupon"
    Frontend->>Contract: MetaMask calls ClaimCoupon(id)
    Contract-->>Contract: Set customer = msg.sender, status = Claimed
    Frontend->>Backend: POST /api/customers/coupons/:id/claim
    Backend->>DB: Update Coupon (claimedBy = user._id)

    Note over Customer,Contract: POS Verification & Redemption
    Customer->>Merchant: Presents Coupon Pass (ID, Code, Wallet)
    Merchant->>Frontend: Enter into POS Scanner
    Frontend->>Backend: POST /api/merchants/verify-coupon
    Backend->>Contract: VerifyCoupon(id, hash)
    Contract-->>Backend: Return isValid=true, status=Claimed
    Backend-->>Frontend: Return Verification Validated

    Merchant->>Frontend: Click "Authorize & Disburse Cashback"
    Frontend->>Contract: MetaMask calls RedeemCoupon(id, hash)
    Contract-->>Contract: Check status != Redeemed (Anti-Double-Spend)
    Contract-->>Contract: Set status = Redeemed, lock reentrancy
    Contract->>Customer: Transfer Cashback ETH
    Contract-->>Frontend: Emit CouponRedeemed & CashbackIssued
    Frontend->>Backend: POST /api/customers/coupons/:id/redeem
    Backend->>DB: Save Cashback & Transaction Records
    Backend-->>Frontend: Display Success & Reward Confirmation
```

---

### Use Case Diagram

```mermaid
flowchart TD
    subgraph Actors
        CustomerActor["Customer"]
        MerchantActor["Merchant"]
        AdminActor["System Admin"]
    end

    subgraph UseCases ["System Use Cases"]
        UC1["Register / Sign In (MetaMask or Password)"]
        UC2["Browse Marketplace & Search Coupons"]
        UC3["Claim Coupon to Decentralized Wallet"]
        UC4["Present & Redeem Coupon for Cashback"]
        UC5["View Cashback Rewards & On-Chain History"]

        UC6["Apply for Merchant Authorization"]
        UC7["Issue Cryptographic Promotional Coupon"]
        UC8["POS Verification & Authenticity Check"]
        UC9["Authorize Redemption & Fund Escrow"]
        UC10["Inspect Merchant Sales Analytics"]

        UC11["Approve or Reject Merchant Applications"]
        UC12["Suspend Fraudulent User Accounts"]
        UC13["Monitor Immutable Transaction Ledger"]
        UC14["Audit System Security & Anti-Fraud Logs"]
        UC15["Emergency Pause Smart Contract"]
    end

    CustomerActor --> UC1
    CustomerActor --> UC2
    CustomerActor --> UC3
    CustomerActor --> UC4
    CustomerActor --> UC5

    MerchantActor --> UC1
    MerchantActor --> UC6
    MerchantActor --> UC7
    MerchantActor --> UC8
    MerchantActor --> UC9
    MerchantActor --> UC10

    AdminActor --> UC1
    AdminActor --> UC11
    AdminActor --> UC12
    AdminActor --> UC13
    AdminActor --> UC14
    AdminActor --> UC15
```

---

### Data Flow Diagram (DFD Level 0 & Level 1)

#### Level 0 DFD (Context Diagram)
```mermaid
flowchart LR
    Customer["Customer"] <-->|Claim Requests / Cashback Receipts| System(("CouponChain Protocol"))
    Merchant["Merchant"] <-->|Voucher Definitions / POS Verifications| System
    Admin["Admin"] <-->|Authorizations / Ledger Monitoring| System
    Ethereum["Ethereum EVM"] <-->|State Transitions / ETH Transfers| System
```

#### Level 1 DFD (Decomposed Modules)
```mermaid
flowchart TD
    P1["1.0 Auth & Identity Manager"]
    P2["2.0 Coupon Engine & Hashing"]
    P3["3.0 Verification & POS Scanner"]
    P4["4.0 Smart Contract Settlement"]
    P5["5.0 Analytics & Security Auditor"]

    D1[("Users & Wallets")]
    D2[("Coupons Store")]
    D3[("Ledger & Cashbacks")]
    D4[("Audit Trail")]

    P1 <--> D1
    P2 -->|Save Coupon Metadata| D2
    P2 -->|Deploy Hash| P4
    P3 -->|Query Coupon & State| D2
    P3 -->|On-Chain Check| P4
    P4 -->|Disburse ETH / Update State| D3
    P5 <--> D3
    P5 <--> D4
```

---

### Class Diagram

```mermaid
classDiagram
    class User {
        +ObjectId id
        +String name
        +String email
        +String password
        +String walletAddress
        +String role
        +String status
        +Number rewardBalance
        +matchPassword(enteredPassword) Boolean
    }

    class Merchant {
        +ObjectId id
        +ObjectId userId
        +String businessName
        +String registrationNumber
        +String category
        +String walletAddress
        +Boolean isApproved
        +Number totalCouponsCreated
        +Number totalRedemptions
    }

    class Coupon {
        +Number couponId
        +ObjectId merchantId
        +String title
        +String code
        +Number discountValue
        +Number cashbackAmountEth
        +String couponHash
        +String status
        +Date expiryDate
        +ObjectId claimedBy
        +String claimedByWallet
    }

    class Cashback {
        +String cashbackId
        +Number couponId
        +String customerWallet
        +String merchantWallet
        +Number amountEth
        +Number amountUSD
        +String blockchainTxHash
        +String status
    }

    class CouponCashbackSystem {
        +address admin
        +mapping authorizedMerchants
        +mapping coupons
        +mapping hashToCouponId
        +CreateCoupon(id, hash, expiry, cashback)
        +ClaimCoupon(id)
        +RedeemCoupon(id, verificationHash)
        +VerifyCoupon(id, hash)
        +RecordCashback(id)
        +CouponAlreadyRedeemed(id) Boolean
        +GetCouponOwner(id) address
        +GetCouponStatus(id) uint8
    }

    User "1" --> "1" Merchant : possesses
    Merchant "1" --> "*" Coupon : issues
    Coupon "1" --> "0..1" Cashback : generates
    Coupon --> CouponCashbackSystem : anchors state to
```

---

### Activity Diagram: Coupon Lifecycle & Anti-Fraud Control

```mermaid
stateDiagram-v2
    [*] --> Draft : Merchant prepares terms
    Draft --> Hashed : Compute Keccak256
    Hashed --> Active : Register on Ethereum
    Active --> Claimed : Customer invokes ClaimCoupon()
    Active --> Expired : block.timestamp > expiry
    Claimed --> Expired : block.timestamp > expiry
    Claimed --> Validating : Presented at Merchant POS
    
    state Validating {
        [*] --> CheckHash
        CheckHash --> HashMatched : couponHash == inputHash
        CheckHash --> FraudBlocked : Tamper Detected
        HashMatched --> CheckState : Check status
        CheckState --> DoubleRedeemBlocked : Status == Redeemed
        CheckState --> ReadyForRedeem : Status == Claimed
    }

    ReadyForRedeem --> Redeemed : RedeemCoupon() executed
    Redeemed --> CashbackPaid : Automated ETH payout
    CashbackPaid --> [*]
    FraudBlocked --> AuditLogged : Record IP & Flag
    AuditLogged --> [*]
    DoubleRedeemBlocked --> [*]
```

---

### Deployment Diagram

```mermaid
flowchart TD
    subgraph ClientDevice ["Client Tier (Browser)"]
        BrowserApp["React SPA (Vite / Tailwind)"]
        MetaMaskExt["MetaMask Extension (Web3 Signer)"]
    end

    subgraph AppServer ["Application Tier (Node.js Server)"]
        ExpressRouter["Express.js Server :5000"]
        HelmetCORS["Helmet / Rate Limiter / CORS"]
        MongooseORM["Mongoose ODM"]
        EthersProvider["Ethers.js JSON-RPC Provider"]
    end

    subgraph DatabaseTier ["Persistence Tier"]
        MongoDaemon["MongoDB Replica Set :27017"]
    end

    subgraph BlockchainTier ["Decentralized Network Tier"]
        EVMNode["Ethereum EVM (Local Hardhat / Sepolia Testnet) :8545"]
        ContractCode["CouponCashbackSystem (0x5FbDB...80aa3)"]
    end

    BrowserApp -->|HTTPS / REST API| ExpressRouter
    MetaMaskExt -->|JSON-RPC via Window.Ethereum| EVMNode
    ExpressRouter --> HelmetCORS
    HelmetCORS --> MongooseORM
    MongooseORM --> MongoDaemon
    ExpressRouter --> EthersProvider
    EthersProvider --> EVMNode
    EVMNode --> ContractCode
```

---

### Comprehensive Verification & Test Results

The smart contract was compiled and exhaustively verified against 15 automated test cases using Hardhat and Chai:

```text
  CouponCashbackSystem Smart Contract
    Deployment and Authorization
      ✔ Should set the deployer as admin and authorized merchant
      ✔ Should allow admin to authorize new merchants
      ✔ Should prevent unauthorized callers from issuing merchant authorizations
    Coupon Creation (CreateCoupon)
      ✔ Should successfully create a coupon and emit CouponCreated event
      ✔ Should prevent duplicate coupon creation with same hash or ID
      ✔ Should reject coupon creation with past expiry date
      ✔ Should reject unauthorized merchants from creating coupons
    Coupon Claiming (ClaimCoupon)
      ✔ Should allow a customer to claim an active coupon
      ✔ Should prevent merchant from claiming their own coupon
      ✔ Should prevent duplicate claiming of an already claimed coupon
    Coupon Verification and Redemption (RedeemCoupon & VerifyCoupon)
      ✔ VerifyCoupon should return valid status for claimed coupon before redemption
      ✔ Should redeem coupon successfully and pay cashback to customer
      ✔ Should prevent double redemption
      ✔ Should detect coupon tampering via mismatched hash
      ✔ Should prevent unauthorized callers from triggering redemption

  15 passing (2s)
```

---

### Limitations

1. **Gas Volatility:** In mainnet deployments, fluctuating Ethereum gas fees can impact small micro-cashback transactions. (Mitigated in this architecture by targeting Layer-2 rollups like Arbitrum, Polygon, or local testnets).
2. **Key Management:** Users without Web3 wallets must rely on the platform's simulated signature flow until MetaMask or an Account Abstraction (ERC-4337) smart wallet is connected.

---

### Future Scope

1. **Account Abstraction (ERC-4337):** Implement social login (Google/Apple) paired with paymaster-sponsored gasless coupon claiming for mainstream non-crypto consumers.
2. **Dynamic NFT Coupons (ERC-721 / ERC-1155):** Upgrade vouchers into transferable, tradeable digital coupon collectibles that visually change upon redemption.
3. **Cross-Chain Bridging (Chainlink CCIP):** Enable coupon issuance on Ethereum with instant zero-gas redemption on Polygon or Base.

---

### Conclusion

The **Blockchain-Based Digital Coupon & Cashback Redemption System** demonstrates how decentralized cryptographic primitives seamlessly solve longstanding commercial fraud vulnerabilities without the overhead of storing every byte on-chain. By isolating state immutability, cryptographic hash verification, and automated cashback to Solidity smart contracts—while offloading rich content to MongoDB—the system delivers a production-grade, highly scalable Web3 commercial platform suitable for academic presentation and real-world deployment.
