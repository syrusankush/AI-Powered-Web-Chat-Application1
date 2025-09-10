const expressAsyncHandler = require("express-async-handler");
const Message = require("../modals/messageModel");
const User = require("../modals/userModel");
const Chat = require("../modals/chatModel");

// 📌 GET all messages for a chat
const allMessages = expressAsyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email")
      .populate("chat");

    res.status(200).json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// 📌 SEND a new message
const sendMessage = expressAsyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({ message: "Invalid data passed into request" });
  }

  const newMessage = {
    sender: req.user._id,
    content,
    chat: chatId,
  };

  try {
    let message = await Message.create(newMessage);

    // Populate references
    message = await message.populate("sender", "name email");
    message = await message.populate("chat");
    message = await User.populate(message, { path: "chat.users", select: "name email" });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.status(201).json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// 📌 MARK messages as seen
const markAsSeen = expressAsyncHandler(async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) return res.status(400).json({ message: "chatId is required" });

  try {
    await Message.updateMany(
      { chat: chatId, seenBy: { $ne: req.user._id } },
      { $addToSet: { seenBy: req.user._id } }
    );

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// Alias for compatibility
const fetchMessages = allMessages;

module.exports = { allMessages, sendMessage, fetchMessages, markAsSeen };
