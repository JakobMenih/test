const express = require("express");
const router = express.Router();

const users_controller = require("../controllers/users");

router.get(
  "/details",
  users_controller.authenticateToken,
  users_controller.returnUser
);
router.post(
  "/verify/send",
  users_controller.authenticateToken,
  users_controller.sendVerificationEmail
);
router.get("/verify/check/:verificationString", users_controller.verifyEmail);

router.post("/token", users_controller.authorizeToken);
router.post("/create", users_controller.createUser);
router.post("/login", users_controller.authenticateUser);

router.put(
  "/update",
  users_controller.authenticateToken,
  users_controller.updateUser
);

//router.delete("/:id/delete", users_controller.deleteUser);

/*router.put(
  "/update",
  users_controller.authenticateToken,
  users_controller.updateUser
);*/

module.exports = router;
