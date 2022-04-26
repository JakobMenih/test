const express = require("express");
const router = express.Router();

const users_controller = require("../controllers/users");
const scraper_controller = require("../controllers/scraper");

router.post("/search", scraper_controller.search);

router.get("/phone/:phone", scraper_controller.getPhoneDetails);

module.exports = router;
