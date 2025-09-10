import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ENDPOINT = "http://localhost:8080";

const AIChat = () => {
  const { chatId: paramChatId } = useParams();
  const userData = JSON.parse(localStorage.getItem("userData"));
  const user = userData?.data;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(paramChatId || null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize AI chat
  useEffect(() => {
    const initAIChat = async () => {
      if (!user?.token) return alert("User not logged in!");

      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      try {
        if (!chatId) {
          // Create or fetch AI chat
          const { data } = await axios.post(`${ENDPOINT}/chat/createAIChat`, {}, config);
          setChatId(data._id);

          // Fetch messages for the new chat
          const msgResponse = await axios.get(`${ENDPOINT}/message/${data._id}`, config);
          setMessages(msgResponse.data);
        } else {
          // Fetch messages for existing chat
          const { data } = await axios.get(`${ENDPOINT}/message/${chatId}`, config);
          setMessages(data);
        }
      } catch (err) {
        console.error("AI Chat init error:", err);
        alert(err.response?.data?.message || "Failed to initialize AI chat");
      }
    };

    initAIChat();
  }, [chatId, user?.token]);

  // Send message to AI
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    const userMessage = {
      sender: { _id: user._id, name: user.name },
      content: newMessage,
    };

    // Optimistically display user message
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setLoading(true);

    const config = { headers: { Authorization: `Bearer ${user.token}` } };

    try {
      const { data } = await axios.post(
        `${ENDPOINT}/chat/aiReply`,
        { chatId, content: userMessage.content },
        config
      );

      setMessages((prev) => [...prev, data]);
    } catch (err) {
      console.error("AI reply error:", err);
      alert(err.response?.data?.message || "Failed to get AI reply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <h2>AI Chat</h2>

      <div className="messages">
        {messages.map((msg, idx) => {
          const senderName = msg.sender?.name || "Unknown";
          const senderId = msg.sender?._id || "ai";

          return (
            <div
              key={idx}
              className={senderId === user._id ? "user-message" : "ai-message"}
            >
              <strong>{senderName}:</strong> {msg.content}
            </div>
          );
        })}
        {loading && <div className="ai-message"><em>AI is typing...</em></div>}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChat;
