const asyncHandler = require("express-async-handler");
const Chat = require("../modals/chatModel");
const User = require("../modals/userModel");
const Message = require("../modals/messageModel");
const axios = require("axios");
// Access or create one-to-one chat
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "UserId is required" });

  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [req.user._id, userId] },
  })
    .populate("users", "-password")
    .populate("latestMessage")
    .lean();

  if (chat) {
    chat.latestMessage = await User.populate(chat.latestMessage, {
      path: "sender",
      select: "name email",
    });
    return res.status(200).json(chat);
  }

  const newChatData = {
    chatName: "sender",
    isGroupChat: false,
    users: [req.user._id, userId],
  };

  const createdChat = await Chat.create(newChatData);
  const fullChat = await Chat.findById(createdChat._id).populate(
    "users",
    "-password"
  );
  res.status(201).json(fullChat);
});

// Fetch all chats for a user
const fetchChats = asyncHandler(async (req, res) => {
  try {
    const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .lean();

    for (let chat of chats) {
      if (chat.latestMessage) {
        chat.latestMessage.sender = await User.findById(chat.latestMessage.sender)
          .select("name email")
          .lean();
      }
    }

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chats", error: error.message });
  }
});

// Fetch all group chats for a user
const fetchGroups = asyncHandler(async (req, res) => {
  const groups = await Chat.find({
    isGroupChat: true,
    users: { $elemMatch: { $eq: req.user._id } },
  })
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .sort({ updatedAt: -1 })
    .lean();

  res.status(200).json(groups);
});

// Create a new group chat
const createGroupChat = asyncHandler(async (req, res) => {
  const { name, users } = req.body;
  if (!name || !users || users.length < 2)
    return res.status(400).json({
      message: "Group name and at least 2 users are required to create a group",
    });

  const groupChat = await Chat.create({
    chatName: name,
    users: [...users, req.user._id],
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  const fullGroupChat = await Chat.findById(groupChat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(201).json(fullGroupChat);
});

// Exit a group chat
const groupExit = asyncHandler(async (req, res) => {
  const { chatId } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found" });

  chat.users = chat.users.filter(
    (userId) => userId.toString() !== req.user._id.toString()
  );

  await chat.save();
  const updatedChat = await Chat.findById(chatId)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json({ message: "Exited group successfully", chat: updatedChat });
});

// Add user(s) to a group
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId)
    return res.status(400).json({ message: "chatId and userId are required" });

  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ message: "Chat not found" });

  if (
    userId !== req.user._id.toString() &&
    chat.groupAdmin.toString() !== req.user._id.toString()
  ) {
    return res
      .status(403)
      .json({ message: "Only group admin can add other users" });
  }

  if (chat.users.includes(userId)) {
    return res.status(400).json({ message: "User already in the group" });
  }

  chat.users.push(userId);
  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json(updatedChat);
});

// Fetch all available groups (public listing)
const fetchAllGroups = asyncHandler(async (req, res) => {
  try {
    const groups = await Chat.find({ isGroupChat: true })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch groups", error: error.message });
  }
});

// Join a group
const joinGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: "chatId is required" });
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ message: "Group not found" });
  }

  if (chat.users.includes(req.user._id)) {
    return res.status(400).json({ message: "You are already a member of this group" });
  }

  chat.users.push(req.user._id);
  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json({ message: "Joined group successfully", chat: updatedChat });
});

// ✅ Create or fetch AI chat
const createAIChat = asyncHandler(async (req, res) => {
  let aiUser = await User.findOne({ email: "ai@chat.com" });

  if (!aiUser) {
    aiUser = await User.create({
      name: "DialoGPT Bot",
      email: "ai@chat.com",
      password: "dummy-password", // hashed by middleware if any
    });
  }

  // Check if AI chat already exists
  let chat = await Chat.findOne({
    isAIChat: true,
    isGroupChat: false,
    users: { $all: [req.user._id, aiUser._id] },
  }).populate("users", "-password");

  if (!chat) {
    chat = await Chat.create({
      chatName: "DialoGPT Bot",
      isGroupChat: false,
      isAIChat: true,
      users: [req.user._id, aiUser._id],
    });

    chat = await Chat.findById(chat._id).populate("users", "-password");
  }

  res.status(200).json(chat);
});

// ✅ Send message to AI and get reply
const aiReply = asyncHandler(async (req, res) => {
  const { chatId, content } = req.body;
  if (!chatId || !content) {
    res.status(400);
    throw new Error("Chat ID and content are required");
  }

  // Save user message
  const userMessage = await Message.create({
    sender: req.user._id,
    content,
    chat: chatId,
  });
  await Chat.findByIdAndUpdate(chatId, { latestMessage: userMessage._id });

  try {
    // Call Hugging Face model (GPT-2 or DialoGPT)
    const hfResponse = await axios.post(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-small",
      { inputs: content },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );

    const aiText =
      hfResponse.data?.generated_text ||
      hfResponse.data?.[0]?.generated_text ||
      "Sorry, I didn’t understand that.";

    // Ensure AI user exists
    let aiUser = await User.findOne({ email: "ai@chat.com" });
    if (!aiUser) {
      aiUser = await User.create({
        name: "DialoGPT Bot",
        email: "ai@chat.com",
        password: "dummy-password",
      });
    }

    // Save AI reply
    const aiMessage = await Message.create({
      sender: aiUser._id,
      content: aiText,
      chat: chatId,
    });
    await Chat.findByIdAndUpdate(chatId, { latestMessage: aiMessage._id });

    res.status(200).json(aiMessage);
  } catch (err) {
    console.error("HF API error:", err.response?.data || err.message || err);

    if (err.response?.status === 401) {
      return res.status(401).json({ message: "Invalid HF API key" });
    }

    if (err.response?.status === 404) {
      return res.status(404).json({ message: "HF model not found" });
    }

    if (err.response?.data?.error?.includes("loading")) {
      return res.status(503).json({
        message: "Model is still loading, try again in a few seconds",
      });
    }

    res.status(500).json({ message: "Failed to get AI reply", details: err.response?.data || err.message });
  }
});





module.exports = {
  accessChat,
  fetchChats,
  fetchGroups,
  createGroupChat,
  groupExit,
  addToGroup,
  fetchAllGroups,
  joinGroup,
  createAIChat,
 
  aiReply
};
