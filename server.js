const express = require("express");
const dotenev = require("dotenv");
const bodyParser = require("body-parser");
const morgan = require("morgan");
// const mongoose = require("mongoose");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
// const authJwt = require("./middleware/authMiddleware");
const connectDB = require("./config/db");
const app = express();

app.use(cors());
app.options("*", cors());

//config
dotenev.config();

//Database Connection
connectDB();

//middlewares
app.use(bodyParser.json());
app.use(morgan("tiny"));
// app.use(authJwt());

//Routers
const productsRouter = require("./routers/products");
const categoriesRouter = require("./routers/categories");
const usersRouter = require("./routers/users");
const ordersRouter = require("./routers/orders");

const api = process.env.API_URL;

//Routes
app.use(`${api}/products`, productsRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/orders`, ordersRouter);

//Handling 404 route
app.use(notFound);

//Custom error Middleware
app.use(errorHandler);

//defining public folder to serve images
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));

// app.listen(3000, () => {
//   console.log(api);
//   console.log("Port is running on 3000");
// });

//Production
const PORT = process.env.PORT || 5000;
app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
// var server = app.listen(process.env.PORT || 3000, () => {
//   var port = server.address().port;
//   console.log("Express is working on port" + port);
// });
