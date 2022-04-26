const express = require("express");
const router = express.Router();

const users_controller = require("../controllers/users");
const stock_controller = require("../controllers/stock");

router.get("/", users_controller.authenticateToken, stock_controller.getStock);

router.post(
  "/add",
  users_controller.authenticateToken,
  stock_controller.addStock
);

module.exports = router;
