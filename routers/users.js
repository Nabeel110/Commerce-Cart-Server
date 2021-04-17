const express = require("express");
const jsonParser = require("../helpers/jsonParser");
const { User } = require("../models/user");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const generateToken = require("../helpers/generateToken");
const { protect, admin } = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");
const router = express.Router();

/*
 @ desc Get all users
 @ route /api/v1/users
 @ access Private
*/
router.get("/", protect, admin, async (req, res) => {
  const userList = await User.find({}).select("-passwordHash");
  if (!userList) {
    return res
      .status(400)
      .json(jsonParser(null, "Users Not retrieved successfully"));
  } else {
    return res
      .status(201)
      .json(jsonParser(userList, "User List retrieved successfully"));
  }
});

/*
 @ desc Get user by id
 @ route /api/v1/users/:id
 @ access Private
*/
router.get("/:id", protect, async (req, res) => {
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json(jsonParser(null, "User doesn't exist"));

  const foundUser = await User.findById(userId).select("-passwordHash");

  if (!foundUser) {
    return res.status(500).status;
  } else {
    res.status(201).json(jsonParser(foundUser, "User retrieved successfully."));
  }
});

/*
 @ desc Register a New User
 @ route /api/v1/users/register
 @ access Public
*/
router.post(
  "/register",
  body("email").isEmail(),
  // password must be at least 5 chars long
  body("password").isLength({ min: 6 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions

      if (!errors.isEmpty()) {
        res.status(422).json(jsonParser(null, { errors: errors.array() }));
        return;
      }
      console.log(req.body);
      const { email } = req.body;
      const userExist = await User.findOne({ email });

      if (userExist) {
        return res
          .status(400)
          .json(jsonParser(null, "User Already exist with this email"));
      }
      let newUser = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        street: req.body.street ? req.body.street : "",
        apartment: req.body.apartment ? req.body.apartment : "",
        city: req.body.city ? req.body.city : "",
        zip: req.body.zip ? req.body.zip : "",
        country: req.body.country ? req.body.country : "",
        phone: req.body.phone,
      });

      newUser = await newUser.save();

      if (!newUser) {
        return res
          .status(400)
          .json(jsonParser(null, "User cannot be created!"));
      } else {
        return res
          .status(201)
          .json(jsonParser(newUser, "User Created Successfully"));
      }
    } catch (err) {
      return next(err);
    }
  }
);

/*
 @ desc Login a New User
 @ route /api/v1/users/login
 @ access Public
*/
router.post("/login", body("email").isEmail(), async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res
      .status(500)
      .json(jsonParser(null, "Body fields cannot be empty."));
  }
  try {
    const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions

    if (!errors.isEmpty()) {
      res.status(422).json(jsonParser(null, { errors: errors.array() }));
      return;
    }
    console.log(req.body);
    let credentials = new User({
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
    });

    const user = await User.findOne({ email: credentials.email });

    if (!user) {
      return res
        .status(500)
        .json(
          jsonParser(
            null,
            "User doesn't exist.Provide correct credentials or register yourself if you are not already registered."
          )
        );
    } else {
      if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
        return res.status(200).json(
          jsonParser(
            {
              user: user.email,
              user_id: user.id,
              token: generateToken(user.id),
            },
            "User Logged In successfully!"
          )
        );
      } else {
        return res
          .status(400)
          .json(jsonParser(null, "Please enter correct credentials"));
      }
    }
  } catch (err) {
    return next(err);
  }
});

/*
 @ desc Get User count
 @ route /api/v1/users/get/count
 @ access Private
*/
router.get("/get/count", protect, admin, async (req, res) => {
  const userCount = await User.countDocuments((count) => count);

  if (!userCount) {
    return res
      .status(500)
      .json(jsonParser(null, "No users found in the database"));
  } else {
    return res
      .status(201)
      .json(jsonParser({ userCount }, "Count of users fetched successfully"));
  }
});

/*
 @ desc DELETE a User by id
 @ route /api/v1/users/:id
 @ access Private
*/
router.delete("/:id", protect, admin, async (req, res) => {
  const userId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(400)
      .json(jsonParser(null, `User with id ${userId} doesn't exist.`));
  }

  const deltedUser = await User.findByIdAndDelete(userId);

  if (!deltedUser) {
    return res.status(500).json(jsonParser(null, "User cannot be deleted!"));
  } else {
    return res
      .status(201)
      .json(jsonParser({ success: true }, "user deleted succesffully!"));
  }
});

/*
 @ desc Update User Profile
 @ route /api/v1/users/:id
 @ access Private
*/
router.put("/profile/:id", protect, async (req, res) => {
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId))
    return res
      .status(400)
      .json(jsonParser(null, `User with id ${userId} doesn't exist`));

  const user = await User.findById(userId);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.passwordHash = bcrypt.hashSync(req.body.password, 10);
    }
    user.street = req.body.street || user.street;
    user.apartment = req.body.apartment || user.apartment;
    user.city = req.body.city || user.city;
    user.zip = req.body.zip || user.zip;
    user.country = req.body.country || user.country;
    user.phone = req.body.phone || user.phone;
  }

  const updatedUser = await user.save();

  if (!updatedUser) {
    return res
      .status(500)
      .json(jsonParser(null, "Error occured while updating user information."));
  } else {
    return res
      .status(201)
      .json(jsonParser(updatedUser, "user Updated successfully!"));
  }
});

module.exports = router;
