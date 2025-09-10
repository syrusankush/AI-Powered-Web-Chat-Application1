const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
     // ✅ NEW FIELD for AI Chats
    isAIChat: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Indexes for faster queries
chatSchema.index({ updatedAt: -1 }); // for sorting chats by latest activity
chatSchema.index({ isGroupChat: 1 }); // quickly fetch group chats
chatSchema.index({ users: 1 }); // optimize queries involving user membership

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
