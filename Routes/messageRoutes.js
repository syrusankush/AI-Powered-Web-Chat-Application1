const express = require("express");
const router = express.Router();

const { fetchMessages, sendMessage, markAsSeen } = require("../Controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

// GET all messages for a chat
router.get("/:chatId", protect, fetchMessages);

// SEND a new message
router.post("/", protect, sendMessage);

// MARK messages as seen
router.put("/seen", protect, markAsSeen);

module.exports = router;
