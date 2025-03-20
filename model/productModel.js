const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    images: [
      {
        public_id: { type: String, trim: true, required: true },
        url: { type: String, trim: true, required: true },
      },
    ], // For Cloudinary or other storage

    price: { type: Number, required: true },
    description: { type: String, trim: true },
    stock: { type: Number, required: true, default: 0 },
    discount: { type: String, default: 0 },
    category: { type: String },
    subCategory: { type: String },
    brandName: { type: String, required: true },
    unitMass: { type: String },
  },
  { timestamps: true }
);

const product = mongoose.model("product", productSchema);

module.exports = product;
