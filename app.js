require("dotenv").config({ path: "./config/.env" });
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db = require("./config/db");
const userRouter = require("./route/userRoute");
const productRouter = require("./route/productRoute");
const auth = require("./middleware/authMiddleware");
const adminAuth = require("./middleware/adminAuth");

const app = express();

//middlewares start here
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://127.0.0.1:5500",
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.options("*", cors());

//routes begins here
app.use("/Auth", userRouter);
app.use("/Product", productRouter);

//protected route
app.get("/protected", auth, adminAuth, (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "this is protected route" });
});

//about server start here
const port = process.env.PORT || 9000;
app.listen(port, () => {
  console.log(`app running on port ${port}!`);
  db();
});
