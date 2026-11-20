const router = require("express").Router();
const ctrl = require("../controllers/branch.controller");
const { protect, allowRoles } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.getBranches);
router.post("/", allowRoles("admin"), ctrl.createBranch);
router.put("/:id", allowRoles("admin"), ctrl.updateBranch);
router.delete("/:id", allowRoles("admin"), ctrl.deleteBranch);

module.exports = router;
