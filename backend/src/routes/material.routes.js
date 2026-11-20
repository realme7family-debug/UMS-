const router = require("express").Router();
const ctrl = require("../controllers/material.controller");
const { protect, allowRoles } = require("../middleware/auth");
const { uploadMaterial } = require("../middleware/upload");

router.use(protect);

router.get("/", ctrl.getMaterials);
router.post("/", allowRoles("faculty"), uploadMaterial.single("file"), ctrl.uploadMaterial);
router.delete("/:id", allowRoles("faculty", "admin"), ctrl.deleteMaterial);

module.exports = router;
