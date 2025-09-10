// Routes/aiRoutes.js
const express = require("express");
const { createAIChat, chatWithHF } = require("../Controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Create/Get AI Chat
router.post("/ai/create", protect, createAIChat);

// 📌 Chat with AI (send user msg + get AI reply)
router.post("/ai/reply", protect, chatWithHF);

module.exports = router;
