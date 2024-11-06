const express = require("express");
const router = express.Router();
const cors = require("cors");
const kanbanController = require("../controllers/kanbans")
const authMiddleware = require('../middleware/auth')

router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(cors());

router.get('/', (req, res) => {res.status(200).json( {success: true, message: "You're Lost, There's Nothing Here!"})})

// permissionss Routes
router.get("/:org/:module", authMiddleware.auth, kanbanController.read);
router.get("/fieldsOrder/:org/:module", authMiddleware.auth, kanbanController.readFieldsOrder);
router.post("/updateOrder/:org/:module", authMiddleware.auth, kanbanController.updateFieldsOrder);
router.post("/updateVisibleFields/:org/:module", authMiddleware.auth, kanbanController.updateVisibleFields);

// router.post("/:org/:module", authMiddleware.auth, sectionsController.create);
// router.delete("/:org/:module", authMiddleware.auth, sectionsController.delete);
// router.get("/:org/profile/:profileId", authMiddleware.auth, permissionsController.readPermissions);
// router.put("/:org", authMiddleware.auth, permissionsController.createPermissions);
// router.put("/:org/profile_permission", authMiddleware.auth, permissionsController.createProfilesPermissions);

module.exports = router