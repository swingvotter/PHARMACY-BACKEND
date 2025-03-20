const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const authHeaders = req.cookies["jwt-cookie"];

    if (!authHeaders) {
      return res.status(401).json({
        success: false,
        message: "you are not authorize to view this page kindly login first",
      });
    }

    const decodeToken = await jwt.verify(
      authHeaders,
      process.env.SECRET_PHRASE
    );
    req.userInfo = decodeToken;

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = auth;
