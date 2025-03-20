const Product = require("../model/productModel");
const fs = require("fs");
const product = require("../model/productModel");
const redisClient = require("../config/redisConfig");
const {
  cloudinaryUploader,
  cloudinaryDelete,
} = require("../util/cloudinaryHelper");

/* LOGIC BEGINS HERE */

const createProdut = async (req, res) => {
  const {
    name,
    price,
    discount,
    description,
    category,
    subCategory,
    unitMass,
    brandName,
    stock,
  } = req.body;

  console.log(req.body);
  console.log(
    name,
    price,
    description,
    category,
    subCategory,
    unitMass,
    brandName,
    stock
  );

  const images = req.files;

  if (!images || images.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  if (!name || !price || !description || !brandName || !unitMass || !stock) {
    return res.status(400).json({
      success: false,
      message: "all field must be provided correctly",
    });
  }

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const filePaths = Array.isArray(req.files)
      ? req.files.map((file) => file.path)
      : [];

    const result = await cloudinaryUploader(filePaths, { folder: "PHARMACY" });

    let product = await Product.findOne({ name });

    if (product) {
      return res.status(409).json({
        success: false,
        message: "product already exist",
      });
    } else {
      product = await Product.create({
        name,
        price,
        discount,
        description,
        category,
        subCategory,
        brandName,
        unitMass,
        stock,
        images: result.map((image) => {
          return { public_id: image.public_id, url: image.secure_url };
        }),
      });
    }

    const products = await Product.find({});

    await redisClient.setEx("products", 600, JSON.stringify(products));

    //delete images on local machine
    req.files.forEach((file) => {
      fs.unlinkSync(file.path);
    });

    return res
      .status(201)
      .json({ success: true, message: "image created successfully", product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//GET product start here

const getProducts = async (req, res) => {
  try {
    const cachedKey = "products";

    const cachedProducts = await redisClient.get(cachedKey);

    if (cachedProducts) {
      const parseCacheProducts = JSON.parse(cachedProducts);
      return res.status(200).json({
        success: true,
        message: "product has been cached succesfully",
        totalProducts: parseCacheProducts.length,
        products: parseCacheProducts,
      });
    }

    const products = await Product.find({});

    if (products.length > 0) {
      await redisClient.setEx(cachedKey, 6000, JSON.stringify(products));
    }

    return res.status(200).json({
      success: true,
      message: "All products fetched successfully",
      totalProducts: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE  product begins here

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "id is missing product cannot be deleted",
    });
  }

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "no product with that id found",
      });
    }

    const result = await Promise.all(
      product.images.map((img) => {
        return cloudinaryDelete(img.public_id);
      })
    );

    await Product.findByIdAndDelete(id);

    const cacheProduct = await redisClient.get("products");

    if (cacheProduct) {
      const products = JSON.parse(cacheProduct);
      const updatedProducts = products.filter((p) => p._id !== id);

      await redisClient.setEx(
        "products",
        6000,
        JSON.stringify(updatedProducts)
      );
    }

    return res.status(200).json({
      success: true,
      message: `product with id ${id} has been deleted`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//GET single product start here
const getSingleProduct = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "id field must be provided correctly" });
  }

  try {
    const cacheProduct = await redisClient.get(`product:${id}`);

    if (cacheProduct) {
      return res.status(200).json({
        success: true,
        message: "cached product fetched",
        product: JSON.parse(cacheProduct),
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "no product found" });
    }

    await redisClient.setEx(`product:${id}`, 600, JSON.stringify(product));

    return res
      .status(200)
      .json({ success: true, message: "product found succesfully", product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE product begins here

const updateProduct = async (req, res) => {
  const { id, public_id } = req.query;

  const {
    name,
    price,
    discount,
    description,
    category,
    subCategory,
    brandName,
    unitMass,
    stock,
  } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "ID is missing; product cannot be updated.",
    });
  }

  try {
    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "No product with that ID found.",
      });
    }

    const imageTodelete = product.images.find(
      (img) => public_id === img.public_id
    );

    if (imageTodelete) {
      await cloudinaryDelete(public_id);
    }

    const removedImage = product.images.filter(
      (img) => public_id !== img.public_id
    );

    product.images = removedImage;
    await product.save();

    if (req.files && req.files.length > 0) {
      const addToCloudinary = await Promise.all(
        req.files.map((file) =>
          cloudinaryUploader(file.path, { folder: "PHARMACY" })
        )
      );
      const updatedimages = removedImage.concat(addToCloudinary);
      product.images = updatedimages;
      await product.save();
    }

    // ✅ Update product in database
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          name,
          price,
          discount,
          description,
          category,
          subCategory,
          brandName,
          unitMass,
          stock,
        },
      },
      { new: true }
    );

    // ✅ Cache Handling
    await redisClient.del(`product:${id}`); // Remove outdated product cache
    await redisClient.setEx(
      `product:${id}`,
      600,
      JSON.stringify(updatedProduct)
    ); // Cache updated product

    const cacheProducts = await redisClient.get("products");

    if (cacheProducts) {
      let parsedProducts = JSON.parse(cacheProducts);
      parsedProducts = parsedProducts.map((p) =>
        p._id === id ? updatedProduct : p
      );
      await redisClient.setEx("products", 600, JSON.stringify(parsedProducts));
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getSingleProduct,
  createProdut,
  deleteProduct,
  updateProduct,
};
