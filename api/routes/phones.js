const express = require("express");
const router = express.Router();

const users_controller = require("../controllers/users");
const phones_controller = require("../controllers/phones");

router.get(
  "/wish/:phoneID",
  users_controller.authenticateToken,
  phones_controller.checkWish
);

router.get(
  "/wishlist",
  users_controller.authenticateToken,
  phones_controller.getWishlist
);

router.get(
  "/wishes",
  users_controller.authenticateToken,
  phones_controller.getWishes
);

router.post(
  "/wish",
  users_controller.authenticateToken,
  phones_controller.wishPhone
);

router.delete(
  "/wish/:phoneID",
  users_controller.authenticateToken,
  phones_controller.removeWish
);

module.exports = router;
