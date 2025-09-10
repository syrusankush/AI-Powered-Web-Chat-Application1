const asyncHandler = require("express-async-handler");
const Chat = require("../modals/chatModel");
const Message = require("../modals/messageModel");
const User = require("../modals/userModel");
const axios = require("axios");

// ✅ Create or get an AI chat between the user and the AI bot
const createAIChat = asyncHandler(async (req, res) => {
  // 1️⃣ Ensure AI user exists
  let aiUser = await User.findOne({ email: "ai@chat.com" });
  if (!aiUser) {
    aiUser = await User.create({
      name: "DialoGPT Bot",
      email: "ai@chat.com",
      password: "dummy-password", // hashed by middleware
    });
  }

  // 2️⃣ Check if AI chat already exists
  let chat = await Chat.findOne({
    isAIChat: true,
    isGroupChat: false,
    users: { $all: [req.user._id, aiUser._id] },
  }).populate("users", "-password");

  if (chat) {
    return res.status(200).json(chat);
  }

  // 3️⃣ Otherwise, create new AI chat
  chat = await Chat.create({
    chatName: "DialoGPT Bot",
    isGroupChat: false,
    isAIChat: true,
    users: [req.user._id, aiUser._id],
  });

  // 4️⃣ Populate users for response
  chat = await Chat.findById(chat._id).populate("users", "-password");

  res.status(201).json(chat);
});


const chatWithHF = asyncHandler(async (req, res) => {
  const { chatId, content } = req.body;

  if (!chatId || !content) {
    res.status(400);
    throw new Error("Chat ID and content are required");
  }

  // 1️⃣ Save user's message
  const userMessage = await Message.create({
    sender: req.user._id,
    content,
    chat: chatId,
  });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: userMessage._id });

  // 2️⃣ Ensure AI user exists
  let aiUser = await User.findOne({ email: "ai@chat.com" });
  if (!aiUser) {
    aiUser = await User.create({
      name: "AI Bot",
      email: "ai@chat.com",
      password: "dummy-password",
    });
  }

  // 3️⃣ Prepare recent chat context (last 10 messages)
  const chatHistory = await Message.find({ chat: chatId })
    .sort({ createdAt: 1 })
    .lean();

  const recentHistory = chatHistory.slice(-10); // last 10 messages
  const context = recentHistory
    .map((msg) => `${msg.sender.toString() === aiUser._id.toString() ? "AI" : "User"}: ${msg.content}`)
    .join("\n");

  const prompt = context + `\nUser: ${content}\nAI:`;

  // 4️⃣ Send to Hugging Face Inference API
  try {
    const hfResponse = await axios.post(
      "https://api-inference.huggingface.co/models/gpt2",
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );

    const aiText = hfResponse.data?.[0]?.generated_text || "Sorry, I didn’t understand that.";

    // 5️⃣ Save AI reply
    const aiMessage = await Message.create({
      sender: aiUser._id,
      content: aiText,
      chat: chatId,
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: aiMessage._id });

    res.status(200).json(aiMessage);
  } catch (err) {
    console.error("HF API error details:", err.response?.data || err.message || err);

    if (err.response?.data?.error?.includes("loading")) {
      return res.status(503).json({
        message: "The AI model is still loading on Hugging Face. Please retry in a few seconds.",
      });
    }

    if (err.response?.status === 401) {
      return res.status(401).json({ message: "Invalid or expired Hugging Face API key." });
    }

    if (err.response?.status === 404) {
      return res.status(404).json({ message: "Hugging Face model not found. Check the model name." });
    }

    res.status(500).json({ message: "Failed to get AI reply", details: err.response?.data || err.message });
  }
});

module.exports = { createAIChat, chatWithHF };
