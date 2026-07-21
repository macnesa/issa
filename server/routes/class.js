const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController");

router.get("/", classController.fetchAllClass);
router.get("/:classId", classController.fetchClassById);

router.post("/", classController.addClass);
router.put("/:id", classController.editClass);

router.delete("/:id", classController.deleteClass);

module.exports = router;