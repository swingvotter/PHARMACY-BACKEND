const {
  getProducts,
  getSingleProduct,
  createProdut,
  deleteProduct,
  updateProduct,
} = require("../controller/productController");
const auth = require("../middleware/authMiddleware");
const upload = require("../config/multer");
const express = require("express");
const router = express.Router();

router.get("/get-products/", getProducts);
router.get("/prod/:id", getSingleProduct);
router.post("/create", upload.array("productImage", 6), createProdut);
router.patch("/update", upload.array("productImage", 6), updateProduct);
router.delete("/delete/:id", deleteProduct);

module.exports = router;
