const express = require("express");
const router = express.Router();

controllerProcessing = require("../controllers/processing/index.js");

router.post("/:filename", controllerProcessing.processing);

module.exports = router;
