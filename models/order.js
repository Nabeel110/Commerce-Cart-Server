const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true,
    },
  ],
  shippingAddress1: {
    type: String,
    required: true,
  },
  shippingAddress2: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "Pending",
  },
  totalPrice: {
    type: Number,
    // required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  const { _id: id, ...result } = object;
  return { ...result, id };
});
exports.Order = mongoose.model("Order", orderSchema);
