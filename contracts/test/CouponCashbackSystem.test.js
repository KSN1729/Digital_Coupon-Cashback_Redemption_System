const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CouponCashbackSystem Smart Contract", function () {
  let CouponCashbackSystem;
  let contract;
  let owner, merchant, customer, attacker;

  const couponId1 = 1001;
  const couponId2 = 1002;
  const rawMetadata1 = "DISCOUNT20-STORE-1-SUMMER";
  const couponHash1 = ethers.keccak256(ethers.toUtf8Bytes(rawMetadata1));
  const rawMetadata2 = "SAVE50-STORE-1-WINTER";
  const couponHash2 = ethers.keccak256(ethers.toUtf8Bytes(rawMetadata2));
  const cashbackAmount = ethers.parseEther("0.05"); // 0.05 ETH

  beforeEach(async function () {
    [owner, merchant, customer, attacker] = await ethers.getSigners();

    CouponCashbackSystem = await ethers.getContractFactory("CouponCashbackSystem");
    contract = await CouponCashbackSystem.deploy();
    await contract.waitForDeployment();

    // Fund the contract pool with 2 ETH for cashback disbursements
    await owner.sendTransaction({
      to: await contract.getAddress(),
      value: ethers.parseEther("2.0"),
    });

    // Authorize merchant
    await contract.setMerchantAuthorization(merchant.address, true);
  });

  describe("Deployment and Authorization", function () {
    it("Should set the deployer as admin and authorized merchant", async function () {
      expect(await contract.admin()).to.equal(owner.address);
      expect(await contract.authorizedMerchants(owner.address)).to.be.true;
    });

    it("Should allow admin to authorize new merchants", async function () {
      expect(await contract.authorizedMerchants(merchant.address)).to.be.true;
    });

    it("Should prevent unauthorized callers from issuing merchant authorizations", async function () {
      await expect(
        contract.connect(attacker).setMerchantAuthorization(attacker.address, true)
      ).to.be.revertedWith("Caller is not admin");
    });
  });

  describe("Coupon Creation (CreateCoupon)", function () {
    it("Should successfully create a coupon and emit CouponCreated event", async function () {
      const futureExpiry = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days

      await expect(
        contract.connect(merchant).CreateCoupon(
          couponId1,
          couponHash1,
          futureExpiry,
          cashbackAmount
        )
      )
        .to.emit(contract, "CouponCreated")
        .withArgs(couponId1, merchant.address, couponHash1, futureExpiry, cashbackAmount);

      const status = await contract.GetCouponStatus(couponId1);
      expect(status).to.equal(1); // Active
    });

    it("Should prevent duplicate coupon creation with same hash or ID", async function () {
      const futureExpiry = Math.floor(Date.now() / 1000) + 86400;

      await contract.connect(merchant).CreateCoupon(
        couponId1,
        couponHash1,
        futureExpiry,
        cashbackAmount
      );

      // Attempt with same ID
      await expect(
        contract.connect(merchant).CreateCoupon(
          couponId1,
          couponHash2,
          futureExpiry,
          cashbackAmount
        )
      ).to.be.revertedWith("Coupon ID already exists");

      // Attempt with same Hash
      await expect(
        contract.connect(merchant).CreateCoupon(
          couponId2,
          couponHash1,
          futureExpiry,
          cashbackAmount
        )
      ).to.be.revertedWith("Duplicate coupon hash detected");
    });

    it("Should reject coupon creation with past expiry date", async function () {
      const pastExpiry = Math.floor(Date.now() / 1000) - 100;
      await expect(
        contract.connect(merchant).CreateCoupon(
          couponId1,
          couponHash1,
          pastExpiry,
          cashbackAmount
        )
      ).to.be.revertedWith("Expiry must be in the future");
    });

    it("Should reject unauthorized merchants from creating coupons", async function () {
      const futureExpiry = Math.floor(Date.now() / 1000) + 86400;
      await expect(
        contract.connect(attacker).CreateCoupon(
          couponId1,
          couponHash1,
          futureExpiry,
          cashbackAmount
        )
      ).to.be.revertedWith("Merchant is not authorized");
    });
  });

  describe("Coupon Claiming (ClaimCoupon)", function () {
    beforeEach(async function () {
      const futureExpiry = Math.floor(Date.now() / 1000) + 86400;
      await contract.connect(merchant).CreateCoupon(
        couponId1,
        couponHash1,
        futureExpiry,
        cashbackAmount
      );
    });

    it("Should allow a customer to claim an active coupon", async function () {
      await expect(contract.connect(customer).ClaimCoupon(couponId1))
        .to.emit(contract, "CouponClaimed");

      const ownerOfCoupon = await contract.GetCouponOwner(couponId1);
      expect(ownerOfCoupon).to.equal(customer.address);

      const status = await contract.GetCouponStatus(couponId1);
      expect(status).to.equal(2); // Claimed
    });

    it("Should prevent merchant from claiming their own coupon", async function () {
      await expect(
        contract.connect(merchant).ClaimCoupon(couponId1)
      ).to.be.revertedWith("Merchant cannot claim own coupon");
    });

    it("Should prevent duplicate claiming of an already claimed coupon", async function () {
      await contract.connect(customer).ClaimCoupon(couponId1);

      await expect(
        contract.connect(attacker).ClaimCoupon(couponId1)
      ).to.be.revertedWith("Coupon is not available for claiming");
    });
  });

  describe("Coupon Verification and Redemption (RedeemCoupon & VerifyCoupon)", function () {
    let futureExpiry;

    beforeEach(async function () {
      futureExpiry = Math.floor(Date.now() / 1000) + 86400;
      await contract.connect(merchant).CreateCoupon(
        couponId1,
        couponHash1,
        futureExpiry,
        cashbackAmount
      );
      await contract.connect(customer).ClaimCoupon(couponId1);
    });

    it("VerifyCoupon should return valid status for claimed coupon before redemption", async function () {
      const result = await contract.VerifyCoupon(couponId1, couponHash1);
      expect(result.isValid).to.be.true;
      expect(result.statusCode).to.equal(2); // Claimed
      expect(result.customer).to.equal(customer.address);
      expect(result.cashbackAmount).to.equal(cashbackAmount);
    });

    it("Should redeem coupon successfully and pay cashback to customer", async function () {
      const initialBalance = await ethers.provider.getBalance(customer.address);

      const tx = await contract.connect(merchant).RedeemCoupon(couponId1, couponHash1);
      await expect(tx).to.emit(contract, "CouponRedeemed");
      await expect(tx).to.emit(contract, "CashbackIssued");

      const finalBalance = await ethers.provider.getBalance(customer.address);
      expect(finalBalance - initialBalance).to.equal(cashbackAmount);

      expect(await contract.CouponAlreadyRedeemed(couponId1)).to.be.true;
      expect(await contract.GetCouponStatus(couponId1)).to.equal(3); // Redeemed
    });

    it("Should prevent double redemption", async function () {
      await contract.connect(merchant).RedeemCoupon(couponId1, couponHash1);

      await expect(
        contract.connect(merchant).RedeemCoupon(couponId1, couponHash1)
      ).to.be.revertedWith("Double redemption prevented: Already redeemed");
    });

    it("Should detect coupon tampering via mismatched hash", async function () {
      const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("TAMPERED-CODE-100%OFF"));

      await expect(
        contract.connect(merchant).RedeemCoupon(couponId1, tamperedHash)
      ).to.be.revertedWith("Tamper detected: Verification hash mismatch");
    });

    it("Should prevent unauthorized callers from triggering redemption", async function () {
      await expect(
        contract.connect(attacker).RedeemCoupon(couponId1, couponHash1)
      ).to.be.revertedWith("Unauthorized redemption caller");
    });
  });
});
