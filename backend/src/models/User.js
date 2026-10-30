const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your full name"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide a valid email address"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email format",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a secure password"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    walletAddress: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      index: true,
    },
    role: {
      type: String,
      enum: ["customer", "merchant", "admin"],
      default: "customer",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    rewardBalance: {
      type: Number,
      default: 0,
    },
    claimedCoupons: [
      {
        coupon: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Coupon",
        },
        claimedAt: {
          type: Date,
          default: Date.now,
        },
        isRedeemed: {
          type: Boolean,
          default: false,
        },
        redeemedAt: {
          type: Date,
        },
      },
    ],
    avatarUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to verify password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
