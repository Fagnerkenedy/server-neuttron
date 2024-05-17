const express = require("express");
const router = express.Router();

const moduleController = require("../controllers/module/index.js");
const fieldController = require("../controllers/fields/index.js");
const recordController = require("../controllers/records/index.js");
const uploadController = require("../controllers/uploads/index.js");
const chartController = require("../controllers/charts/index.js");
const authMiddleware = require('../middleware/auth')

// Modulos
router.post("/:org/module", authMiddleware, moduleController.create);
router.get("/:org/modules", authMiddleware, moduleController.read);
router.get("/:org/:module/relatedModule", authMiddleware, moduleController.readRelatedModule);
router.put("/:org/module", authMiddleware, moduleController.update);
router.delete("/:org/module", authMiddleware, moduleController.delete);

// Campos
router.post("/:org/:module/field", authMiddleware, fieldController.create);
router.get("/:org/:module/fields", authMiddleware, fieldController.read);
router.get("/:org/:module/field/:api_name", authMiddleware, fieldController.readOptions);
router.get("/:org/:module/relatedField/:record_id", authMiddleware, fieldController.readRelatedField);
router.put("/:org/:module/field", authMiddleware, fieldController.update);
router.put("/:org/:module/relatedField", authMiddleware, fieldController.updateRelatedField);
router.delete("/:org/:module/field", authMiddleware, fieldController.delete);

// Registros
router.post("/:org/:module/record", authMiddleware, recordController.create);
router.get("/:org/:module", authMiddleware, recordController.fetch);
router.get("/:org/:module/:id", authMiddleware, recordController.read);
router.get("/:org/:module/relatedData/:related_id/:api_name", authMiddleware, recordController.readRelatedData);
router.get("/:org/:module/relatedData/:related_id", authMiddleware, recordController.readRelatedData2);
router.get("/:org/:module/relatedDataById/:module_id", authMiddleware, recordController.readRelatedDataById);
router.put("/:org/:module/:id", authMiddleware, recordController.update);
router.delete("/:org/:module/:id", authMiddleware, recordController.delete);

// Uploads
router.put("/:org/:module/upload", authMiddleware, uploadController.upload);

module.exports = router;