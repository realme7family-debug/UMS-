const router = require("express").Router();
const ctrl = require("../controllers/exam.controller");
const { protect, allowRoles } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.getExams);
router.post("/", allowRoles("admin"), ctrl.createExam);
router.put("/:id", allowRoles("admin"), ctrl.updateExam);
router.delete("/:id", allowRoles("admin"), ctrl.deleteExam);

module.exports = router;
