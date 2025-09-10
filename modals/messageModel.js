const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // 🔹 Index sender for quick filtering
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true, // 🔹 Index chat for faster chat lookups
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// 🔹 Compound index: Speeds up fetching messages inside a chat by date
messageSchema.index({ chat: 1, createdAt: -1 });

// 🔹 Optional: Full-text index on content for searching messages
messageSchema.index({ content: "text" });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;