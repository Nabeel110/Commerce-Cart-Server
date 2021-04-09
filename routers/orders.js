const express = require("express");
const jsonParser = require("../helpers/jsonParser");
const { OrderItem } = require("../models/orderItem");
const { Order } = require("../models/order");
const { protect, admin } = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");
const router = express.Router();

/*
  @ desc  GET all orders
  @ route /api/v1/orders/
  @ access PUBLIC
*/
router.get("/", async (req, res) => {
  const orderList = await Order.find({})
    .populate("user", "name")
    .sort({ createdAt: -1 });

  if (!orderList) {
    return res.status(400).json(jsonParser(null, "Orders not retrieved"));
  } else {
    return res
      .status(201)
      .json(jsonParser(orderList, "Orders Succesfully Retrieved!"));
  }
});

/*
  @ desc  GET order by id
  @ route /api/v1/orders/:id
  @ access PUBLIC
*/
router.get("/:id", async (req, res) => {
  const orderFound = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });

  if (!orderFound) {
    return res
      .status(500)
      .json(jsonParser(null, `Order with ${req.params.id} not Found`));
  } else {
    return res
      .status(201)
      .json(jsonParser(orderFound, "Order Retrieved Successfully!"));
  }
});

/*
  @ desc  Create an Order
  @ route /api/v1/orders/
  @ access PUBLIC
*/
router.post(
  "/",
  body("orderItems"),
  body("quanitity"),
  body("product"),
  body("user"),
  async (req, res, next) => {
    try {
      const errors = validationResult(req); // Finds the validation errors in this request and wraps them in an object with handy functions

      if (!errors.isEmpty()) {
        res.status(422).json({ errors: errors.array() });
        return;
      }
      const orderItemsIds = Promise.all(
        req.body.orderItems.map(async (orderItem) => {
          let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product,
          });

          newOrderItem = await newOrderItem.save();

          return newOrderItem._id;
        })
      );
      const orderItemsIdsResolved = await orderItemsIds;

      const totalPrices = await Promise.all(
        orderItemsIdsResolved.map(async (orderItemId) => {
          const orderItem = await OrderItem.findById(orderItemId).populate(
            "product",
            "price"
          );
          const totalPrice = orderItem.product.price * orderItem.quantity;
          return totalPrice;
        })
      );

      const totalPrice = totalPrices.reduce((a, b) => a + b, 0);
      console.log(totalPrices);

      let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
      });

      order = await order.save();

      if (!order) {
        return res
          .status(400)
          .json(jsonParser(null, "Order cannot be Created!"));
      } else {
        return res
          .status(201)
          .json(jsonParser(order, "Order Successfully Created!"));
      }
    } catch (err) {
      return next(err);
    }
  }
);

/*
  @ desc  Update an Order Status by id
  @ route /api/v1/orders/
  @ access PRIVATE
*/
router.put("/:id", protect, admin, async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    {
      new: true,
    }
  );

  if (!order) {
    return res
      .status(500)
      .json(jsonParser(null, "Order Status Cannot be Updated."));
  } else {
    return res
      .status(201)
      .json(jsonParser(order, "Order Status Updated Succssfully"));
  }
});

router.delete("/:id", protect, admin, async (req, res) => {
  const orderId = req.params.id;
  Order.findByIdAndDelete(orderId, { useFindAndModify: false })
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (orderItem) => {
          await orderItem.findByIdAndDelete(orderItem);
        });
        res.status(200).json({
          header: {
            error: 0,
            message: "Order succesfully Deleted",
          },
          body: {
            success: true,
          },
        });
      } else {
        res.status(404).json({
          header: {
            error: 1,
            message: "Order Not Found",
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

/*
  @ desc  GET Total Sales on our shop for statistics
  @ route /api/v1/orders/get/sales
  @ access PRIVATE
*/
router.get("/get/totalsales", protect, admin, async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } },
  ]);

  if (!totalSales) {
    return res
      .status(400)
      .json(jsonParser(null, "Total Sales Cannot be Generated."));
  } else {
    return res
      .status(200)
      .json(
        jsonParser(
          { totalSales: totalSales.pop().totalSales },
          "Total Sales Generated Sucessfully!"
        )
      );
  }
});

/*
  @ desc  GET Total Orders Made statistics
  @ route /api/v1/orders/get/totalorders
  @ access PRIVATE
*/
router.get("/get/totalorders", protect, admin, async (req, res) => {
  const orderCount = await Order.countDocuments((count) => count);

  if (!orderCount) {
    return res
      .status(400)
      .json(jsonParser(null, "Cannot fetched total Orders..."));
  } else {
    return res
      .status(200)
      .json(
        jsonParser(
          { totalOrders: orderCount },
          "Total Number of Orders fetched."
        )
      );
  }
});

/*
  @ desc  GET List of all Orders User made by id
  @ route /api/v1/orders/get/userorders/:id
  @ access PRIVATE
*/
router.get("/get/userorders/:id", protect, async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.id })
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .sort({ createdAt: -1 });

  if (!userOrderList) {
    return res
      .status(400)
      .json(jsonParser(null, "User OrderList not retrieved"));
  } else {
    return res
      .status(201)
      .json(jsonParser(userOrderList, "User OrderList Succesfully Retrieved!"));
  }
});

module.exports = router;
