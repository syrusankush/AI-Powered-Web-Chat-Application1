const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  accessChat,
  fetchChats,
  fetchGroups,
  createGroupChat,
  groupExit,
  fetchAllGroups,
  joinGroup,
  createAIChat,
  getChatById,
  aiReply
} = require("../controllers/chatControllers");

const router = express.Router();

// One-to-one chat
router.post("/access", protect, accessChat);

// Fetch all chats of logged-in user
router.get("/", protect, fetchChats);  // shortcut for Sidebar.jsx
router.get("/fetchChats", protect, fetchChats);

// Fetch group chats of logged-in user
router.get("/fetchGroups", protect, fetchGroups);

// Create group chat
router.post("/createGroup", protect, createGroupChat);

// Exit group
router.put("/groupExit", protect, groupExit);

// All groups (public listing)
router.get("/allGroups", protect, fetchAllGroups);

// Join group
router.put("/joinGroup", protect, joinGroup);
// Create or fetch AI chat
router.post("/createAIChat", protect, createAIChat);



router.post("/ai/reply", protect, aiReply);

module.exports = router;
