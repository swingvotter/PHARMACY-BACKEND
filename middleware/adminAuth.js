const User = require("../model/userModel");

const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.userInfo.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    if (user.role !== "admin") {
      return res
        .status(401)
        .json({ success: false, message: "this page is only for admins" });
    }

    console.log(user);

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = adminAuth;
