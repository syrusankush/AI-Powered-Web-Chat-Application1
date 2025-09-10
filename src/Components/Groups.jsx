import React, { useContext, useEffect, useState } from "react";
import "./myStyles.css";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, Button } from "@mui/material";
import logo from "../Images/live-chat_512px.png";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import RefreshIcon from "@mui/icons-material/Refresh";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { myContext } from "./MainContainer";

function Groups() {
  const { refresh, setRefresh } = useContext(myContext);
  const lightTheme = useSelector((state) => state.themeKey);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const userData = JSON.parse(localStorage.getItem("userData"));
  const navigate = useNavigate();
  if (!userData) {
    navigate("/");
  }
  const user = userData?.data;

  // Function to fetch groups
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      const res = await axios.get("http://localhost:8080/chat/allGroups", config);
      setGroups(res.data);
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to join group
  const joinGroup = async (groupId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user?.token}` } };
      await axios.put("http://localhost:8080/chat/joinGroup", { chatId: groupId }, config);
      alert("Joined group successfully!");
      fetchGroups(); // refresh after joining
      setRefresh(!refresh);
    } catch (err) {
      console.error("Failed to join group:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to join group");
    }
  };

  // Fetch groups initially and whenever refresh changes
  useEffect(() => {
    fetchGroups();
  }, [refresh]);

  const handleGroupClick = (group) => {
    navigate(`/app/chat/${group._id}&${group.chatName}`);
    setRefresh(!refresh); // trigger chat refresh
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ ease: "anticipate", duration: 0.3 }}
        className="list-container"
      >
        {/* Header */}
        <div className={`ug-header${lightTheme ? "" : " dark"}`}>
          <img
            src={logo}
            alt="Logo"
            style={{ height: "2rem", width: "2rem", marginLeft: "10px" }}
          />
          <p className={`ug-title${lightTheme ? "" : " dark"}`}>Available Groups</p>
          <IconButton
            className={`icon${lightTheme ? "" : " dark"}`}
            onClick={fetchGroups} // manually refresh
          >
            <RefreshIcon />
          </IconButton>
        </div>

        {/* Search */}
        <div className={`sb-search${lightTheme ? "" : " dark"}`}>
          <IconButton className={`icon${lightTheme ? "" : " dark"}`}>
            <SearchIcon />
          </IconButton>
          <input
            placeholder="Search"
            className={`search-box${lightTheme ? "" : " dark"}`}
          />
        </div>

        {/* Group List */}
        <div className="ug-list">
          {loading && <p>Loading groups...</p>}
          {!loading && groups.length === 0 && <p>No groups available</p>}
          {!loading &&
            groups.map((group, index) => {
              const isMember = group.users.some(
                (u) => u._id.toString() === user._id.toString()
              );
              return (
                <motion.div
                  key={group._id || index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className={`list-item${lightTheme ? "" : " dark"}`}
                >
                  <p className={`con-icon${lightTheme ? "" : " dark"}`}>
                    {group.chatName?.[0] || "G"}
                  </p>
                  <p className={`con-title${lightTheme ? "" : " dark"}`}>
                    {group.chatName}
                  </p>
                  {isMember ? (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleGroupClick(group)}
                    >
                      Open
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => joinGroup(group._id)}
                    >
                      Join
                    </Button>
                  )}
                </motion.div>
              );
            })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Groups;
