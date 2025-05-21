const express = require("express");
const multer = require("multer");
const router = express.Router();
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "uploads/");
  },
  filename: function (req, file, callback) {
    callback(
      null,
      file.originalname + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

//controllers
const controllerUpload = require("../controllers/upload/index.js");

//getUserData
router.post("/", upload.single("file"), controllerUpload.upload);

module.exports = router;
