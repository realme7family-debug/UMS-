const router = require("express").Router();
const ctrl = require("../controllers/marks.controller");
const { protect, allowRoles } = require("../middleware/auth");

router.use(protect);

router.get("/my", allowRoles("student"), ctrl.getMyMarks);
router.get("/sheet", allowRoles("admin", "faculty"), ctrl.getMarksSheet);
router.post("/bulk", allowRoles("admin", "faculty"), ctrl.saveMarks);

module.exports = router;
