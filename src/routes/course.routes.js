const router = require("express").Router();
const courseController = require("../controllers/course.controller");
const { protect, requireRole } = require("../middlewares/auth");

// list and get are protected so you can hide catalog if you want; change to public if desired.
router.get("/", protect, courseController.listCourses);
router.get("/:id", protect, courseController.getCourse);

// admin only
router.post("/", protect, requireRole("admin"), courseController.createCourse);
router.patch("/:id", protect, requireRole("admin"), courseController.updateCourse);
router.delete("/:id", protect, requireRole("admin"), courseController.deleteCourse);

module.exports = router;
