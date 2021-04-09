const { Category } = require("../models/category");
const express = require("express");
const jsonParser = require("../helpers/jsonParser");
const { protect, admin } = require("../middleware/authMiddleware");
const router = express.Router();

/*
    @ desc  GET all categories
    @ route /api/v1/categories/
    @ access Public
*/
router.get("/", async (req, res) => {
  const categoryList = await Category.find();

  if (!categoryList) {
    return res.status(404).json(jsonParser(null, "No Category found"));
  } else if (categoryList && categoryList.length === 0) {
    return res.json(jsonParser(categoryList, "No Categories Created!"));
  } else {
    return res
      .status(200)
      .json(jsonParser(categoryList, "Categories retrieved successfully!"));
  }
});

/*
    @ desc  GET category by id
    @ route /api/v1/categories/:id
    @ access Public
*/
router.get("/:id", async (req, res) => {
  let categoryId = req.params.id;
  const categoryFound = await Category.findById(categoryId);

  if (!categoryFound) {
    res
      .status(500)
      .json(
        jsonParser(
          null,
          `Category with the given id: ${categoryId} was not found.`
        )
      );
  } else {
    res
      .status(200)
      .json(jsonParser(categoryFound, "Category retrived successfully"));
  }
});

/*
    @ desc   Adding a category
    @ route  /api/v1/categories/
    @  access  Private
*/
router.post("/", protect, admin, async (req, res) => {
  let category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });

  category = await category.save();

  if (!category) {
    // {
    //     header: {
    //       error: 1,
    //       message: "Category cannot be created!",
    //     },
    //   }
    return res
      .status(404)
      .json(jsonParser(null, "Category cannot be created!"));
  } else {
    // header: {
    //     error: 0,
    //     message: "A new category was craeted successfully",
    //   },
    //   body: {
    //     category,
    //   },
    return res
      .status(200)
      .json(jsonParser(category, "A new category was created successfully"));
  }
});

/*
    @ desc  PUT updating category by id
    @ route /api/v1/categories/:id
    @ access Private
*/
router.put("/:id", protect, admin, async (req, res) => {
  let updatedCategory;
  try {
    updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          icon: req.body.icon,
          color: req.body.color,
        },
      },
      { new: true, useFindAndModify: false }
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        jsonParser(
          updatedCategory,
          `Category with id ${req.params.id} doesn't exist.`
        )
      );
  }

  if (updatedCategory) {
    return res
      .status(200)
      .json(jsonParser(updatedCategory, "Category updated successfully"));
  } else {
    return res
      .status(500)
      .json(jsonParser(updatedCategory, "Category was not updated!"));
  }
});

/*
@ desc  Deleting a category
@ route /api/v1/categories/:id
@ access  Private
*/
router.delete("/:id", protect, admin, (req, res) => {
  const categoryId = req.params.id;
  Category.findByIdAndDelete(categoryId, { useFindAndModify: false })
    .then((category) => {
      if (category) {
        res.status(200).json({
          header: {
            error: 0,
            message: "Category succesfully Deleted",
          },
          body: {
            success: true,
          },
        });
      } else {
        res.status(404).json({
          header: {
            error: 1,
            message: "Category Not Found",
          },
          body: { success: false },
        });
      }
    })
    .catch((err) => {
      res.status(400).json({
        header: {
          error: 1,
          message: err,
        },
        body: { success: false },
      });
    });
});

module.exports = router;
