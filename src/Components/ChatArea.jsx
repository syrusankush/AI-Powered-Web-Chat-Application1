import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { myContext } from "./MainContainer";
import axios from "axios";
import { io } from "socket.io-client";
import MessageSelf from "./MessageSelf";
import MessageOthers from "./MessageOthers";
import Skeleton from "@mui/material/Skeleton";
import SendIcon from "@mui/icons-material/Send";
import { IconButton } from "@mui/material";

const ENDPOINT = "http://localhost:8080";
let socket;

function ChatArea() {
  const lightTheme = useSelector((state) => state.themeKey);
  const [currentChat, setCurrentChat] = useState(null); // stores chat info
const [newGroupName, setNewGroupName] = useState(""); // for renaming
const [userToAdd, setUserToAdd] = useState(""); // userId to add

  const [messageContent, setMessageContent] = useState("");
  const { id } = useParams();
  const [chat_id, chat_user] = id?.split("&") || ["", ""];
  const userData = JSON.parse(localStorage.getItem("userData"));
  const { refresh } = useContext(myContext);

  const [allMessages, setAllMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
  const fetchChatInfo = async () => {
    try {
      const { data } = await axios.get(`${ENDPOINT}/chat/${chat_id}`, { headers: getAuthHeader() });
      setCurrentChat(data);
      setNewGroupName(data.chatName); // prefill rename input
    } catch (err) {
      console.error("Fetch chat info error:", err);
    }
  };
  if (chat_id) fetchChatInfo();
}, [chat_id]);


  // Get headers with token
const getAuthHeader = () => ({
  Authorization: `Bearer ${userData?.data?.token}`,
});



  // send message
  const sendMessage = () => {
    if (!messageContent.trim()) return;

    const config = {
      headers: { Authorization: `Bearer ${userData.data.token}` },
    };

    axios
      .post(
        `${ENDPOINT}/message`,
        { content: messageContent, chatId: chat_id },
        config
      )
      .then(({ data }) => {
        socket.emit("new message", data);
        setMessageContent("");
        setAllMessages((prev) => [...prev, data]);
      })
      .catch((err) => console.error("Send message error:", err));
  };

  // socket connection
  useEffect(() => {
    socket = io(ENDPOINT);

    socket.emit("setup", userData.data);
    socket.on("connected", () => console.log("Socket connected"));

    if (chat_id) socket.emit("join chat", chat_id);

    socket.on("message received", (newMessage) => {
      if (newMessage.chat._id === chat_id) {
        setAllMessages((prev) => [...prev, newMessage]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [chat_id]);

  // fetch messages
  useEffect(() => {
    const config = { headers: { Authorization: `Bearer ${userData.data.token}` } };
    axios
      .get(`${ENDPOINT}/message/${chat_id}`, config)
      .then(({ data }) => {
        console.log("Fetched messages:", data); // 👀 debug
        const msgs = Array.isArray(data) ? data : data?.messages || [];
        setAllMessages(msgs);
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Fetch messages error:", err);
        setLoaded(true);
      });
  }, [chat_id, refresh]);

  if (!loaded)
    return (
      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 10 }}>
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={60} />
      </div>
    );

  return (
    <div className={"chatArea-container" + (lightTheme ? " light" : " dark")}>
      <div className={"messages-container" + (lightTheme ? " light" : " dark")}>
        {Array.isArray(allMessages) && allMessages.length > 0 ? (
          allMessages
            .slice(0)
            .reverse()
            .map((message, index) => {
              if (!message || !message.sender) return null;
              const self_id = userData?.data?._id;
              return message.sender._id === self_id ? (
                <MessageSelf key={message._id || index} message={message} />
              ) : (
                <MessageOthers key={message._id || index} message={message} />
              );
            })
        ) : (
          <p style={{ color: "gray", textAlign: "center" }}>No messages yet.</p>
        )}
      </div>

      <div className={"text-input-area" + (lightTheme ? " light" : " dark")}>
        <input
          placeholder="Type your message"
          className={"search-box" + (lightTheme ? " light" : " dark")}
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyDown={(e) => e.code === "Enter" && sendMessage()}
        />
        <IconButton onClick={sendMessage}>
          <SendIcon />
        </IconButton>
      </div>
    </div>
  );
}

export default ChatArea;
