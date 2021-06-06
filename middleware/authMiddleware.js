const jwt = require("jsonwebtoken");
const jsonParser = require("../helpers/jsonParser");
const { User } = require("../models/user");
const dotenev = require("dotenv");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-hashPassword");

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json(jsonParser("Not authorized, token failed"));
    }
  }
  if (!token) {
    res.status(401).json(jsonParser("Not authorized, no token"));
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json(jsonParser(null, "Not authorized as an admin"));
  }
};

module.exports = {
  protect,
  admin,
};
// const expressJwt = require("express-jwt");

// const authJwt = () => {
//   const secret = process.env.JWT_SECRET;
//   const api = process.env.API_URL;
//   return expressJwt({
//     secret,
//     algorithms: ["HS256"],
//     isRevoked: isRevoked,
//   }).unless({
//     path: [
//       { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
//       { url: /\/api\/v1\/products(.*)/, methods: ["GET", "OPTIONS"] },
//       { url: /\/api\/v1\/categories(.*)/, methods: ["GET", "OPTIONS"] },
//       { url: /\/api\/v1\/orders(.*)/, methods: ["GET", "OPTIONS", "POST"] },
//       `${api}/users/login`,
//       `${api}/users/register`,
//     ],
//   });
// };

// async function isRevoked(req, payload, done) {
//   if (!payload.isAdmin) {
//     done(null, true);
//   } else {
//     done();
//   }
// }

// module.exports = authJwt;
