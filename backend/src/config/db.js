const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/coupon_blockchain_db";
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MongoDB at ${process.env.MONGODB_URI || "mongodb://127.0.0.1:27017"}.`);
    console.warn(`[Database Warning] Please ensure MongoDB is running or set MONGODB_URI in .env`);
    // In production we would exit, but for development gracefully allow mock fallback or restart
    return null;
  }
};

module.exports = connectDB;
