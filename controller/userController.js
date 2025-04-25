const User = require("../model/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const otpGenerator = require("../util/otpGenerator");
const otpSender = require("../util/otpSender");

const userDetail = async (req, res) => {
  try {
    const user = await User.find({ isVerified: true }).select(
      "firstName lastName email telephoneNo address"
    );

    res.status(200).json({
      success: true,
      message: "userDetails fetched succesfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//sending otp start here
const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email field cannot be empty" });
  }

  try {
    // Generate OTP and expiration time
    const otp = otpGenerator();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({ email });

    if (user) {
      if (user.emailOtpExpiration && user.emailOtpExpiration > Date.now()) {
        return res.status(429).json({
          success: false,
          message:
            "otp is already sent to ur email wait for 10 minutes before requesting new one",
        });
      }

      if (user.isVerified)
        return res
          .status(400)
          .json({ success: false, message: "account already verified" });

      user.emailOtp = otp;
      user.emailOtpExpiration = expiresAt;
      await user.save();
    } else {
      user = await User.create({
        email,
        emailOtp: otp,
        emailOtpExpiration: expiresAt,
      });
    }

    // Send the OTP email
    await otpSender.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Confirm Email OTP",
      html: `<p>Your confirmation OTP is: <h1>${otp}</h1></p>`,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. It will expires in 10 minutes.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//verify otp start here
const verifyOtp = async (req, res) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({ success: false, message: "invalid input" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "user not found" });

    if (user.isVerified)
      return res
        .status(400)
        .json({ success: false, message: "user already verified" });

    if (user.emailOtp !== otpCode)
      return res
        .status(400)
        .json({ success: false, message: "otp do not match" });

    if (user.emailOtpExpiration < Date.now())
      return res.status(400).json({
        success: false,
        message: "otp code expire request a new code",
      });

    user.isVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiration = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verify successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//register logic begins here
const registerUser = async (req, res) => {
  const { email } = req.query;

  const {
    firstName,
    lastName,
    password,
    confirmPassword,
    telephoneNo,
    DOB,
    gender,
    address,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !password ||
    !confirmPassword ||
    !telephoneNo ||
    !DOB ||
    !gender ||
    !address
  ) {
    return res.status(400).json({
      success: false,
      message: "make sure to provide all the provided fields",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    if (!user.isVerified || (user.emailOtp && user.emailOtpExpiration)) {
      return res.status(403).json({
        success: false,
        message:
          "verify your account before you can continue with registeration",
      });
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    const registeredUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          firstName,
          lastName,
          password: hashedpassword,
          telephoneNo,
          DOB,
          gender,
          address,
        },
      },
      { new: true }
    );

    const { password: _, ...userWithoutPassword } = registeredUser.toObject();
    return res.status(201).json({
      success: true,
      message: "account created succesfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.telephoneNo
    ) {
      return res.status(409).json({
        success: false,
        message: "Telephone number already registered with another account",
      });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

//forget password begins here
const forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "invalid field email field must be provided",
    });
  }

  try {
    // Generate OTP and expiration time
    const otp = otpGenerator();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.findOne({ email });

    if (user) {
      if (
        user.resetPasswordOtp &&
        user.resetPasswordOtpExpiration > Date.now()
      ) {
        return res.status(429).json({
          success: false,
          message:
            "otp code already sent to Your gmail wait 10 mins before requesting another",
        });
      }

      if (!user.isVerified) {
        return res.status(400).json({
          success: false,
          message: "account must be verified before trying to reset password",
        });
      }

      user.resetPasswordOtp = otp;
      user.resetPasswordOtpExpiration = expiresAt;
      await user.save();
    }

    // Send the OTP email
    await otpSender.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "reset password OTP",
      html: `<p>Your reset password OTP is <h1>${otp}</h1></p>`,
    });

    return res
      .status(200)
      .json({ success: true, message: "otp sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//verify forget password begins here
const verifyResetPassword = async (req, res) => {
  const { email } = req.params;
  const { otpCode } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({
      success: false,
      message: "all field must be provided correctly",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    if (user.resetPasswordOtp && user.resetPasswordOtpExpiration < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "otp expired request for new one" });
    }

    if (user.resetPasswordOtp !== otpCode) {
      return res.status(400).json({
        success: false,
        message: "reset password otpCode do not match",
      });
    }

    const resetPasswordToken = jwt.sign(
      { id: user._id },
      process.env.SECRET_PHRASE,
      { expiresIn: "10m" }
    );

    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiration = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "reset otp is verified successfully",
      docu: "redirect user to reset password and make sure to provide me with resetPasswordToken",
      resetPasswordToken,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//reset password logic begins here
const resetPassword = async (req, res) => {
  const { resetPasswordToken } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "all field must be provided correctly",
    });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "password do not match" });
  }

  if (!resetPasswordToken) {
    return res.status(400).json({
      success: false,
      message: "reset password token must be provided",
    });
  }

  try {
    const decodeResetPasswordToken = await jwt.verify(
      resetPasswordToken,
      process.env.SECRET_PHRASE
    );

    const user = await User.findById(decodeResetPasswordToken.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "password has been reseted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//login logic begins here
const loginUser = async (req, res) => {
  const { loginDetail, password } = req.body;

  if (!loginDetail || !password) {
    return res
      .status(500)
      .json({ success: false, message: "email,number,password is missing" });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: loginDetail }, { telephoneNo: loginDetail }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found register a new account",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "account must be verified before trying to login",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "invalid email or password" });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.SECRET_PHRASE, {
      expiresIn: "1h",
    });

    res.cookie("jwt-cookie", accessToken, {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60,
    });

    console.log(req.userInfo);

    return res.status(200).json({
      success: true,
      message: "You have login successfully",
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//logout begins here
const logoutUser = async (req, res) => {
  console.log(req.userInfo);

  if (!req.userInfo) {
    return res.status(200).json({
      success: false,
      message: "you can only logout when you are login",
    });
  }
  res.cookie("jwt-cookie", "", {
    maxAge: 100,
  });
  return res
    .status(200)
    .json({ success: true, message: "account logout successfully" });
};

module.exports = {
  sendOtp,
  verifyOtp,
  registerUser,
  loginUser,
  logoutUser,
  forgetPassword,
  verifyResetPassword,
  resetPassword,
  userDetail,
};
