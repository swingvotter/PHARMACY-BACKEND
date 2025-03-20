const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, trim: true, required: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    telephoneNo: { type: String, unique: true, sparse: true, trim: true },
    DOB: { type: Date },
    address: { type: String, trim: true },
    gender: { type: String, trim: true, enum: ["male", "female"] },
    role: {
      type: String,
      trim: true,
      enum: ["user", "admin"],
      default: "user",
    },
    password: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },

    //otp verification start here

    emailOtp: { type: String, trim: true },
    emailOtpExpiration: { type: Date },
    resetPasswordOtp: { type: String, trim: true },
    resetPasswordOtpExpiration: { type: Date },
  },
  { timestamps: true }
);

const user = mongoose.model("user", userSchema);

module.exports = user;
