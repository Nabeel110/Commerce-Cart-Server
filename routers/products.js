const { Product } = require("../models/product");
const express = require("express");
const jsonParser = require("../helpers/jsonParser");
const mongoose = require("mongoose");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("Invalid Image Type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

// router.get(`/public/uploads/:image`, async (req, res) => {
//   //file search
//   console.log(req.params.image);
//   // return res.json({ message: "hello" });
//   fs.readdir(process.cwd(), function (err, files) {
//     if (err) {
//       console.log(err);
//       return;
//     }
//     console.log(files);
//   });
// });http://commerce-cart-14.herokuapp.com/public/uploads
// "E:/6th semester/Mobile Application/Project/e-commerce-app/backend - Copy/public/uploads/"
/// Show filesE:\6th semester\Mobile Application\Project\e-commerce-app\backend - Copy\public\uploads
router.get("/public/uploads/:image", function (req, res) {
  file = req.params.image;
  var img = fs.readFileSync(
    "http://commerce-cart-14.herokuapp.com/public/uploads/" + file
  );
  res.writeHead(200, { "Content-Type": "image/jpg" });
  res.end(img, "binary");
});

/*
  @ desc GET all Products
  @ route /api/v1/products
  @ access PUBLIC
*/
router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }
  const productList = await Product.find(filter).populate("category");

  if (productList) {
    res
      .status(200)
      .json(jsonParser(productList, "Products retrieved sucsessfully!"));
  } else {
    res
      .status(500)
      .json(
        jsonParser({ success: false }, "Cannot retrieve products from database")
      );
  }
});

/*
  @ desc GET Product by ID
  @ route /api/v1/products/:id
  @ access PUBLIC
*/
router.get("/:id", async (req, res) => {
  const productId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(productId))
    return res
      .status(400)
      .json(jsonParser(null, `Product with id ${productId} doesn't exist`));

  const productFound = await Product.findById(productId).populate("category");

  if (!productFound) {
    return res.status(500).json(jsonParser(null, "Product Not Found"));
  } else {
    return res
      .status(201)
      .json(jsonParser(productFound, "Product retrived successfully!"));
  }
});

/*
  @ desc  Create a Product
  @ route /api/v1/products
  @ access PRIVATE
*/
router.post(
  `/`,
  protect,
  admin,
  uploadOptions.single("image"),
  async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.body.category))
      return res.status(400).send("Invalid Category");

    const file = req.file;
    if (!file) {
      return res.status(400).json(jsonParser(null, "No Image File Uploaded"));
    }
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/products/public/uploads/`;
    let product = new Product({
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: `${basePath}${fileName}`,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    });

    product = await product.save();

    if (!product) {
      return res
        .status(500)
        .json(jsonParser({ success: false }, "The product cannot be Created!"));
    } else {
      return res
        .status(201)
        .json(jsonParser(product, "Product was created sucessfully!"));
    }

    // product
    //   .save()
    //   .then((createdProduct) => {
    //     res.status(201).json(createdProduct);
    //   })
    //   .catch((err) => {
    //     res.status(500).json({
    //       error: err,
    //       success: false,
    //     });
    //   });
  }
);

/*
  @ desc  Update a Product by id => add Images in Image Gallery
  @ route /api/v1/products
  @ access PRIVATE
*/
router.put(
  "/gallery-images/:id",
  protect,
  admin,
  uploadOptions.array("images", 10),
  async (req, res) => {
    const productId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(productId))
      return res
        .status(400)
        .json(jsonParser(null, `Product with id ${productId} doesn't exist`));

    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          images: imagesPaths,
        },
      },
      { new: true, useFindAndModify: false }
    );
    if (!updatedProduct) {
      return res
        .status(500)
        .json(jsonParser(null, "Gallery Images not Uploaded!"));
    } else {
      return res
        .status(201)
        .json(
          jsonParser(
            updatedProduct,
            "Gallery Images were uploaded successfully!"
          )
        );
    }
  }
);

/*
  @ desc  Update a Product by id
  @ route /api/v1/products/:id
  @ access PRIVATE
*/
router.put("/:id", protect, admin, async (req, res) => {
  const productId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(productId))
    return res
      .status(400)
      .json(jsonParser(null, `Product with id ${productId} doesn't exist`));

  // validating catgeory
  if (!mongoose.Types.ObjectId.isValid(req.body.category))
    return res.status(400).json(jsonParser(null, "Invalid Category"));

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      $set: {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
      },
    },
    { new: true, useFindAndModify: false }
  );

  if (!updatedProduct) {
    return res.status(500).json(jsonParser(null, "Product was not updated!"));
  } else {
    return res
      .status(201)
      .json(jsonParser(updatedProduct, "Product was updated successfully!"));
  }
});

/*
  @ desc  Delete a Product by id
  @ route /api/v1/products/:id
  @ access PRIVATE
*/
router.delete(`/:id`, protect, admin, async (req, res) => {
  const productId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(productId))
    return res
      .status(400)
      .json(jsonParser(null, `Product with id ${productId} doesn't exist`));

  const productDeleted = await Product.findByIdAndDelete(productId);
  if (!productDeleted) {
    return res.status(500).json(jsonParser(null, "Product Cannot be Deleted!"));
  } else {
    return res
      .status(201)
      .json(jsonParser({ success: true }, "Product Deleted Successfully"));
  }
});

/*
  @ desc  GET Product Count For statistics
  @ route /api/v1/products/get/count
  @ access PRIVATE
*/
router.get("/get/count", protect, admin, async (req, res) => {
  const productCount = await Product.countDocuments((count) => count);

  if (!productCount) {
    res.status(500).json({
      header: {
        error: 1,
        message: "Error while counting products!",
      },
      body: {
        success: false,
      },
    });
  } else {
    res
      .status(201)
      .json(
        jsonParser({ productCount }, "Product Count retrieved successfully!")
      );
  }
});

/*
  @ desc  GET Featured Product
  @ route /api/v1/products/get/featured/:count
  @ access Public
*/
router.get("/get/featured/:count", async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const featuredProducts = await Product.find({ isFeatured: true })
    .limit(+count)
    .populate("category");
  const countFeaturedProducts = await featuredProducts.length;

  if (!featuredProducts) {
    return res
      .status(500)
      .json(
        jsonParser(null, "Cannot retrieve featured products from database")
      );
  } else {
    res
      .status(201)
      .json(
        jsonParser(
          { featuredProducts, count: countFeaturedProducts },
          "Retrieves featured products successfully!"
        )
      );
  }
});
module.exports = router;
