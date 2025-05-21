const express = require("express");
const router = express.Router();

controllerDownloadModel = require("../controllers/downloadModel/index.js");

router.get("/", controllerDownloadModel.download);

module.exports = router;