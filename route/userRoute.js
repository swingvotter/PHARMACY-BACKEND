const express = require("express");
const auth = require("../middleware/authMiddleware");
const {
  sendOtp,
  verifyOtp,
  registerUser,
  loginUser,
  logoutUser,
  forgetPassword,
  verifyResetPassword,
  resetPassword,
} = require("../controller/userController");
const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", auth, logoutUser);
router.post("/forget-password", forgetPassword);
router.post("/verify-reset-password/:email", verifyResetPassword);
router.patch("/reset-password/:resetPasswordToken", resetPassword);

module.exports = router;
