const express = require("express");
const router = express.Router();
const cors = require("cors");
const notificationController = require("../controllers/notifications")

router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(cors());

router.post("/", notificationController.payment);

module.exports = router