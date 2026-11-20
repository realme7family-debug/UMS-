const router = require("express").Router();
const ctrl = require("../controllers/subject.controller");
const { protect, allowRoles } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.getSubjects);
router.post("/", allowRoles("admin"), ctrl.createSubject);
router.put("/:id", allowRoles("admin"), ctrl.updateSubject);
router.delete("/:id", allowRoles("admin"), ctrl.deleteSubject);

module.exports = router;
