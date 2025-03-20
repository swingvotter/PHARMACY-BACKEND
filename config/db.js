const mongoose = require("mongoose");

const db = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    console.log("db connected successfully");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = db;
