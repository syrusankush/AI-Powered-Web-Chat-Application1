// Sidebar.jsx
import React, { useContext, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import NightlightIcon from "@mui/icons-material/Nightlight";
import LightModeIcon from "@mui/icons-material/LightMode";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SearchIcon from "@mui/icons-material/Search";
import ChatIcon from "@mui/icons-material/Chat";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../Features/themeSlice";
import axios from "axios";
import { myContext } from "./MainContainer";

const ENDPOINT = "http://localhost:8080";

function Sidebar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const lightTheme = useSelector((state) => state.themeKey);
  const { refresh, setRefresh } = useContext(myContext);

  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (!userData) navigate("/");

  const user = userData.data;

  // Fetch chats and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };

        const { data: chatData } = await axios.get(
          `${ENDPOINT}/chat/fetchChats`,
          config
        );
        setConversations(chatData);

        const { data: usersData } = await axios.get(
          `${ENDPOINT}/user/fetchUsers`,
          config
        );
        setUsers(usersData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [refresh, user.token]);

  // Navigate to chat when clicking a conversation
  const handleChatClick = (conversation) => {
    if (conversation.isAIChat) navigate(`/app/ai-chat/${conversation._id}`);
    else {
      const displayName = conversation.isGroupChat
        ? conversation.chatName
        : conversation.users.find((u) => u._id !== user._id)?.name || "Chat";
      navigate(`/app/chat/${conversation._id}&${displayName}`);
    }
    setRefresh(!refresh);
  };

  // Navigate to one-to-one chat with a user
  const handleUserClick = (otherUser) => {
    navigate(`/app/chat/${otherUser._id}&${otherUser.name}`);
    setRefresh(!refresh);
  };

  // Users not in any one-to-one chat yet
  const usersWithoutChat = users.filter((u) => {
    if (u._id === user._id) return false;
    return !conversations.some(
      (conv) =>
        !conv.isGroupChat &&
        conv.users.some((cu) => cu._id === u._id)
    );
  });

  // Open or create AI Chat
  const handleAIChat = async () => {
    if (!user?.token) return alert("User not logged in!");
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      const { data } = await axios.post(
        `${ENDPOINT}/chat/createAIChat`,
        {},
        config
      );

      navigate(`/app/ai-chat/${data._id}`);
    } catch (err) {
      console.error("AI chat navigation error:", err);
      alert("Failed to open AI chat");
    }
  };

  return (
    <div className="sidebar-container">
      {/* Header Icons */}
      <div className={"sb-header" + (lightTheme ? "" : " dark")}>
        <div className="other-icons">
          <IconButton onClick={() => navigate("/app/welcome")}>
            <AccountCircleIcon className={"icon" + (lightTheme ? "" : " dark")} />
          </IconButton>
          <IconButton onClick={() => navigate("users")}>
            <PersonAddIcon className={"icon" + (lightTheme ? "" : " dark")} />
          </IconButton>
          <IconButton onClick={() => navigate("groups")}>
            <GroupAddIcon className={"icon" + (lightTheme ? "" : " dark")} />
          </IconButton>
          <IconButton onClick={() => navigate("create-groups")}>
            <AddCircleIcon className={"icon" + (lightTheme ? "" : " dark")} />
          </IconButton>

          {/* AI Chat Button */}
          <IconButton onClick={handleAIChat}>
            <ChatIcon className={"icon" + (lightTheme ? "" : " dark")} />
          </IconButton>

          <IconButton onClick={() => dispatch(toggleTheme())}>
            {lightTheme ? <NightlightIcon className="icon" /> : <LightModeIcon className="icon" />}
          </IconButton>
          <IconButton
            onClick={() => {
              localStorage.removeItem("userData");
              navigate("/");
            }}
          >
            <ExitToAppIcon className={"icon" + (lightTheme ? "" : " dark")} />
          </IconButton>
        </div>
      </div>

      {/* Search Bar */}
      <div className={"sb-search" + (lightTheme ? "" : " dark")}>
        <IconButton className={"icon" + (lightTheme ? "" : " dark")}>
          <SearchIcon />
        </IconButton>
        <input
          placeholder="Search"
          className={"search-box" + (lightTheme ? "" : " dark")}
        />
      </div>

      {/* Conversations */}
      <div className={"sb-conversations" + (lightTheme ? "" : " dark")}>
        {conversations.map((conv) => {
          let displayName = "";
          let displayInitial = "";

          if (conv.isAIChat) {
            displayName = "AI Bot";
            displayInitial = "A";
          } else if (conv.isGroupChat) {
            displayName = conv.chatName;
            displayInitial = conv.chatName[0];
          } else {
            const otherUser = conv.users.find((u) => u._id !== user._id);
            displayName = otherUser?.name || "Unknown User";
            displayInitial = otherUser?.name ? otherUser.name[0] : "?";
          }

          return (
            <div
              key={conv._id}
              className="conversation-container"
              onClick={() => handleChatClick(conv)}
            >
              <p className={"con-icon" + (lightTheme ? "" : " dark")}>{displayInitial}</p>
              <p className={"con-title" + (lightTheme ? "" : " dark")}>{displayName}</p>
              <p className="con-lastMessage">
                {conv.latestMessage?.content || "No previous messages, click here to start a new chat"}
              </p>
            </div>
          );
        })}

        {/* Users without existing chat */}
        {usersWithoutChat.map((otherUser) => (
          <div
            key={otherUser._id}
            className="conversation-container"
            onClick={() => handleUserClick(otherUser)}
          >
            <p className={"con-icon" + (lightTheme ? "" : " dark")}>{otherUser.name[0]}</p>
            <p className={"con-title" + (lightTheme ? "" : " dark")}>{otherUser.name}</p>
            <p className="con-lastMessage">Start a chat</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
