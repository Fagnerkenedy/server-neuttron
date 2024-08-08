const express = require("express");
const router = express.Router();

const moduleController = require("../controllers/module/index.js");
const fieldController = require("../controllers/fields/index.js");
const recordController = require("../controllers/records/index.js");
const uploadController = require("../controllers/uploads/index.js");
const authMiddleware = require('../middleware/auth')
const { authorize } = require('../middleware/auth');

// Modulos
router.post("/:org/module", authMiddleware.auth,                                     moduleController.create);
router.get("/:org/modules", authMiddleware.auth,                                     moduleController.read);
router.get("/:org/:module/relatedModule", authMiddleware.auth,                       authorize('read'), moduleController.readRelatedModule);
router.put("/:org/module", authMiddleware.auth,                                      moduleController.update);
router.delete("/:org/module", authMiddleware.auth,                                   moduleController.delete);

// Campos
router.post("/:org/:module/field", authMiddleware.auth,                              authorize('create'), fieldController.create);
router.get("/:org/:module/fields", authMiddleware.auth,                              authorize('read'), fieldController.read);
router.get("/:org/:module/unused_fields", authMiddleware.auth,                       authorize('read'), fieldController.readUnusedFields);
router.get("/:org/:module/field/:api_name", authMiddleware.auth,                     authorize('read'), fieldController.readOptions);
router.get("/:org/:module/relatedField/:record_id", authMiddleware.auth,             authorize('read'), fieldController.readRelatedField);
router.put("/:org/:module/field", authMiddleware.auth,                               authorize('update'), fieldController.update);
router.put("/:org/:module/unused_field", authMiddleware.auth,                        authorize('update'), fieldController.updateUnusedFields);
router.put("/:org/:module/relatedField", authMiddleware.auth,                        authorize('update'), fieldController.updateRelatedField);
router.delete("/:org/:module/field", authMiddleware.auth,                            authorize('delete'), fieldController.delete);

// Registros
router.post("/:org/:module/record", authMiddleware.auth,                             authorize('create'), recordController.create);
router.get("/:org/:module", authMiddleware.auth,                                     authorize('read'), recordController.fetch);
router.get("/:org/:module/:id", authMiddleware.auth,                                 authorize('read'), recordController.read);
router.get("/:org/:module/relatedData/:related_id/:api_name", authMiddleware.auth,   authorize('read'), recordController.readRelatedData);
router.get("/:org/:module/relatedData/:related_id", authMiddleware.auth,             authorize('read'), recordController.readRelatedData2);
router.get("/:org/:module/relatedDataById/:module_id", authMiddleware.auth,          authorize('read'), recordController.readRelatedDataById);
router.put("/:org/:module/:id", authMiddleware.auth,                                 authorize('update'), recordController.update);
router.delete("/:org/:module/:id", authMiddleware.auth,                              authorize('delete'), recordController.delete);

// Uploads
router.put("/:org/:module/upload", authMiddleware.auth,                              authorize('create', 'Upload'), uploadController.upload);

module.exports = router;