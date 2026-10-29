// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CouponCashbackSystem
 * @dev Decentralized digital coupon issuance, verification, redemption and cashback smart contract.
 * Prevents double redemption, coupon tampering, duplicate cashback, and unauthorized issuance.
 */
contract CouponCashbackSystem {
    // --- Data Structures ---

    enum CouponStatus {
        NonExistent, // 0
        Active,      // 1: Created by merchant, open for claiming
        Claimed,     // 2: Claimed by a customer wallet
        Redeemed,    // 3: Successfully redeemed at merchant
        Expired,     // 4: Exceeded expiration timestamp
        Revoked      // 5: Deactivated by merchant/admin
    }

    struct Coupon {
        uint256 couponId;           // Unique identifier
        address payable merchant;   // Merchant issuer wallet
        address customer;           // Assigned/Claiming customer wallet
        uint256 expiry;             // Unix timestamp of expiration
        CouponStatus status;        // Current lifecycle status
        bytes32 couponHash;         // SHA256/Keccak256 hash of off-chain metadata (terms, discount, code)
        uint256 redemptionTimestamp;// Timestamp of redemption (0 if unredeemed)
        uint256 cashbackAmount;     // Cashback amount in Wei
        bool cashbackPaid;          // Flag to guarantee no duplicate cashback
    }

    // --- State Variables ---

    address public admin;
    uint256 public totalCoupons;
    uint256 public totalCashbackPaid;
    uint256 public totalRedemptions;

    // Authorized merchants mapping
    mapping(address => bool) public authorizedMerchants;
    
    // Core coupon registry by ID
    mapping(uint256 => Coupon) public coupons;

    // Mapping from coupon hash to couponId to prevent duplicate coupon creation
    mapping(bytes32 => uint256) public hashToCouponId;

    // Customer claimed coupons index: customer => array of couponIds
    mapping(address => uint256[]) private customerCoupons;

    // Merchant coupons index: merchant => array of couponIds
    mapping(address => uint256[]) private merchantCoupons;

    // Reentrancy guard lock
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // Emergency pause
    bool public paused;

    // --- Events ---

    event CouponCreated(
        uint256 indexed couponId,
        address indexed merchant,
        bytes32 couponHash,
        uint256 expiry,
        uint256 cashbackAmount
    );

    event CouponClaimed(
        uint256 indexed couponId,
        address indexed customer,
        uint256 timestamp
    );

    event CouponRedeemed(
        uint256 indexed couponId,
        address indexed merchant,
        address indexed customer,
        uint256 redemptionTimestamp,
        uint256 cashbackAmount
    );

    event CashbackIssued(
        uint256 indexed couponId,
        address indexed customer,
        uint256 amount,
        uint256 timestamp
    );

    event MerchantAuthorized(address indexed merchant, bool isAuthorized);
    event MerchantDeposit(address indexed merchant, uint256 amount);
    event CouponRevoked(uint256 indexed couponId, address indexed merchant);

    // --- Modifiers ---

    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not admin");
        _;
    }

    modifier onlyAuthorizedMerchant() {
        require(authorizedMerchants[msg.sender] || msg.sender == admin, "Merchant is not authorized");
        _;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is currently paused");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedMerchants[msg.sender] = true;
        _status = _NOT_ENTERED;
    }

    // --- Admin Functions ---

    function setMerchantAuthorization(address _merchant, bool _authorized) external onlyAdmin {
        require(_merchant != address(0), "Invalid merchant address");
        authorizedMerchants[_merchant] = _authorized;
        emit MerchantAuthorized(_merchant, _authorized);
    }

    function setPaused(bool _paused) external onlyAdmin {
        paused = _paused;
    }

    // Deposit funds to escrow pool for cashback rewards
    receive() external payable {}

    function fundContract() external payable {
        require(msg.value > 0, "Deposit must be greater than 0");
        emit MerchantDeposit(msg.sender, msg.value);
    }

    // --- Core Coupon Lifecycle Functions ---

    /**
     * @notice Create a new cryptographic coupon record on blockchain
     * @param _couponId Unique numeric coupon ID (coordinated with backend)
     * @param _couponHash Keccak256 hash of (couponCode, discountPercent, terms, merchantId)
     * @param _expiry Unix expiration timestamp
     * @param _cashbackAmount Reward in Wei attached to this coupon
     */
    function CreateCoupon(
        uint256 _couponId,
        bytes32 _couponHash,
        uint256 _expiry,
        uint256 _cashbackAmount
    ) public payable onlyAuthorizedMerchant whenNotPaused {
        require(_couponId > 0, "Coupon ID must be greater than 0");
        require(coupons[_couponId].status == CouponStatus.NonExistent, "Coupon ID already exists");
        require(_expiry > block.timestamp, "Expiry must be in the future");
        require(_couponHash != bytes32(0), "Invalid coupon hash");
        require(hashToCouponId[_couponHash] == 0, "Duplicate coupon hash detected");

        // If coupon has cashback, merchant can fund it upon creation or rely on pre-funded contract pool
        if (msg.value > 0) {
            require(msg.value >= _cashbackAmount, "Sent value less than cashback amount");
        }

        coupons[_couponId] = Coupon({
            couponId: _couponId,
            merchant: payable(msg.sender),
            customer: address(0),
            expiry: _expiry,
            status: CouponStatus.Active,
            couponHash: _couponHash,
            redemptionTimestamp: 0,
            cashbackAmount: _cashbackAmount,
            cashbackPaid: false
        });

        hashToCouponId[_couponHash] = _couponId;
        merchantCoupons[msg.sender].push(_couponId);
        totalCoupons++;

        emit CouponCreated(_couponId, msg.sender, _couponHash, _expiry, _cashbackAmount);
    }

    // camelCase alias for standard web3 wrappers
    function createCoupon(
        uint256 _couponId,
        bytes32 _couponHash,
        uint256 _expiry,
        uint256 _cashbackAmount
    ) external payable {
        CreateCoupon(_couponId, _couponHash, _expiry, _cashbackAmount);
    }

    /**
     * @notice Customer claims an active coupon
     * @param _couponId The ID of the coupon to claim
     */
    function ClaimCoupon(uint256 _couponId) public whenNotPaused {
        Coupon storage coupon = coupons[_couponId];

        require(coupon.status != CouponStatus.NonExistent, "Coupon does not exist");
        require(coupon.status == CouponStatus.Active, "Coupon is not available for claiming");
        require(coupon.expiry > block.timestamp, "Coupon has expired");
        require(coupon.customer == address(0), "Coupon already claimed");
        require(msg.sender != address(0), "Invalid customer address");
        require(msg.sender != coupon.merchant, "Merchant cannot claim own coupon");

        coupon.customer = msg.sender;
        coupon.status = CouponStatus.Claimed;

        customerCoupons[msg.sender].push(_couponId);

        emit CouponClaimed(_couponId, msg.sender, block.timestamp);
    }

    // camelCase alias
    function claimCoupon(uint256 _couponId) external {
        ClaimCoupon(_couponId);
    }

    /**
     * @notice Redeem coupon and disburse cashback
     * Can be invoked by merchant upon validating user's presentation, or user with merchant signature
     * @param _couponId The ID of the coupon to redeem
     * @param _verificationHash Hash supplied at redemption to verify against stored hash
     */
    function RedeemCoupon(
        uint256 _couponId,
        bytes32 _verificationHash
    ) public nonReentrant whenNotPaused {
        Coupon storage coupon = coupons[_couponId];

        require(coupon.status != CouponStatus.NonExistent, "Coupon does not exist");
        require(coupon.status != CouponStatus.Redeemed, "Double redemption prevented: Already redeemed");
        require(coupon.status != CouponStatus.Revoked, "Coupon has been revoked");
        require(coupon.status == CouponStatus.Claimed, "Coupon must be claimed before redemption");
        require(coupon.expiry > block.timestamp, "Coupon has expired");
        require(coupon.couponHash == _verificationHash, "Tamper detected: Verification hash mismatch");

        // Sender must be either merchant or claimed customer
        require(
            msg.sender == coupon.merchant || msg.sender == coupon.customer || msg.sender == admin,
            "Unauthorized redemption caller"
        );

        address customer = coupon.customer;
        uint256 cashback = coupon.cashbackAmount;

        // State update strictly BEFORE external transfer (Checks-Effects-Interactions pattern)
        coupon.status = CouponStatus.Redeemed;
        coupon.redemptionTimestamp = block.timestamp;
        totalRedemptions++;

        emit CouponRedeemed(_couponId, coupon.merchant, customer, block.timestamp, cashback);

        // Process cashback if reward amount > 0 and not yet paid
        if (cashback > 0 && !coupon.cashbackPaid) {
            coupon.cashbackPaid = true;
            totalCashbackPaid += cashback;

            if (address(this).balance >= cashback) {
                (bool success, ) = payable(customer).call{value: cashback}("");
                require(success, "Cashback transfer failed");
                emit CashbackIssued(_couponId, customer, cashback, block.timestamp);
            }
        }
    }

    // camelCase alias
    function redeemCoupon(uint256 _couponId, bytes32 _verificationHash) external {
        RedeemCoupon(_couponId, _verificationHash);
    }

    /**
     * @notice Verify coupon validity, expiration, and status
     */
    function VerifyCoupon(
        uint256 _couponId,
        bytes32 _checkHash
    ) public view returns (
        bool isValid,
        uint8 statusCode,
        address customer,
        uint256 expiry,
        uint256 cashbackAmount
    ) {
        Coupon storage coupon = coupons[_couponId];

        if (coupon.status == CouponStatus.NonExistent) {
            return (false, 0, address(0), 0, 0);
        }

        bool hashMatches = (coupon.couponHash == _checkHash);
        bool notExpired = (coupon.expiry > block.timestamp);
        bool validState = (coupon.status == CouponStatus.Claimed || coupon.status == CouponStatus.Active);

        isValid = hashMatches && notExpired && validState;
        statusCode = uint8(coupon.status);
        customer = coupon.customer;
        expiry = coupon.expiry;
        cashbackAmount = coupon.cashbackAmount;
    }

    // camelCase alias
    function verifyCoupon(
        uint256 _couponId,
        bytes32 _checkHash
    ) external view returns (
        bool isValid,
        uint8 statusCode,
        address customer,
        uint256 expiry,
        uint256 cashbackAmount
    ) {
        return VerifyCoupon(_couponId, _checkHash);
    }

    /**
     * @notice Explicitly record or disburse cashback if separated from redemption step
     */
    function RecordCashback(uint256 _couponId) public nonReentrant whenNotPaused {
        Coupon storage coupon = coupons[_couponId];

        require(coupon.status == CouponStatus.Redeemed, "Coupon not yet redeemed");
        require(!coupon.cashbackPaid, "Duplicate cashback prevented: Already paid");
        require(coupon.cashbackAmount > 0, "No cashback allocated for this coupon");
        require(
            msg.sender == coupon.merchant || msg.sender == admin,
            "Only merchant or admin can record cashback"
        );

        coupon.cashbackPaid = true;
        totalCashbackPaid += coupon.cashbackAmount;

        address customer = coupon.customer;
        uint256 amount = coupon.cashbackAmount;

        if (address(this).balance >= amount) {
            (bool success, ) = payable(customer).call{value: amount}("");
            require(success, "Cashback ETH transfer failed");
        }

        emit CashbackIssued(_couponId, customer, amount, block.timestamp);
    }

    // camelCase alias
    function recordCashback(uint256 _couponId) external {
        RecordCashback(_couponId);
    }

    /**
     * @notice Check if a coupon is already redeemed
     */
    function CouponAlreadyRedeemed(uint256 _couponId) public view returns (bool) {
        return coupons[_couponId].status == CouponStatus.Redeemed;
    }

    function couponAlreadyRedeemed(uint256 _couponId) external view returns (bool) {
        return CouponAlreadyRedeemed(_couponId);
    }

    /**
     * @notice Retrieve the registered owner (customer) of a claimed coupon
     */
    function GetCouponOwner(uint256 _couponId) public view returns (address) {
        require(coupons[_couponId].status != CouponStatus.NonExistent, "Coupon does not exist");
        return coupons[_couponId].customer;
    }

    function getCouponOwner(uint256 _couponId) external view returns (address) {
        return GetCouponOwner(_couponId);
    }

    /**
     * @notice Retrieve the current lifecycle status of a coupon
     */
    function GetCouponStatus(uint256 _couponId) public view returns (uint8) {
        Coupon storage coupon = coupons[_couponId];
        if (coupon.status == CouponStatus.NonExistent) return 0;
        if (coupon.status != CouponStatus.Redeemed && coupon.status != CouponStatus.Revoked && coupon.expiry <= block.timestamp) {
            return uint8(CouponStatus.Expired);
        }
        return uint8(coupon.status);
    }

    function getCouponStatus(uint256 _couponId) external view returns (uint8) {
        return GetCouponStatus(_couponId);
    }

    /**
     * @notice Revoke / deactivate a coupon (Merchant or Admin)
     */
    function revokeCoupon(uint256 _couponId) external {
        Coupon storage coupon = coupons[_couponId];
        require(coupon.status != CouponStatus.NonExistent, "Coupon does not exist");
        require(coupon.status != CouponStatus.Redeemed, "Cannot revoke redeemed coupon");
        require(msg.sender == coupon.merchant || msg.sender == admin, "Not authorized to revoke");

        coupon.status = CouponStatus.Revoked;
        emit CouponRevoked(_couponId, msg.sender);
    }

    // --- Query Helpers ---

    function getCouponsByCustomer(address _customer) external view returns (uint256[] memory) {
        return customerCoupons[_customer];
    }

    function getCouponsByMerchant(address _merchant) external view returns (uint256[] memory) {
        return merchantCoupons[_merchant];
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
