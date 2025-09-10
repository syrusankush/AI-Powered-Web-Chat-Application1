import React, { useContext, useEffect, useState } from "react";
import "./myStyles.css";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import logo from "../Images/live-chat_512px.png";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { refreshSidebarFun } from "../Features/refreshSidebar";
import { myContext } from "./MainContainer";

function Users() {
  const { refresh, setRefresh } = useContext(myContext);
  const lightTheme = useSelector((state) => state.themeKey);
  const [users, setUsers] = useState([]);
  const userData = JSON.parse(localStorage.getItem("userData"));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  if (!userData) {
    console.log("User not Authenticated");
    navigate("/");
  }

  const token = userData?.data?.token;
  const selfId = userData?.data?._id;

  useEffect(() => {
    if (!token) return;

    const config = { headers: { Authorization: `Bearer ${token}` } };

    axios
      .get("http://localhost:8080/user/fetchUsers", config)
      .then((res) => {
        console.log("Fetched Users:", res.data);
        setUsers(res.data);
      })
      .catch((err) => console.log("Error fetching users:", err));
  }, [refresh, token]);

  const createChat = (userId) => {
    if (!token) return;

    const config = { headers: { Authorization: `Bearer ${token}` } };

    axios
      .post("http://localhost:8080/chat/access", { userId }, config) // ✅ fixed endpoint
      .then(() => {
        dispatch(refreshSidebarFun());
        setRefresh(!refresh);
        navigate("/app"); // go back to sidebar
      })
      .catch((err) => console.log("Error creating chat:", err));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3 }}
        className="list-container"
      >
        <div className={"ug-header" + (lightTheme ? "" : " dark")}>
          <img
            src={logo}
            alt="Logo"
            style={{ height: "2rem", width: "2rem", marginLeft: "10px" }}
          />
          <p className={"ug-title" + (lightTheme ? "" : " dark")}>
            Available Users
          </p>
          <IconButton
            className={"icon" + (lightTheme ? "" : " dark")}
            onClick={() => setRefresh(!refresh)}
          >
            <RefreshIcon />
          </IconButton>
        </div>

        <div className={"sb-search" + (lightTheme ? "" : " dark")}>
          <IconButton className={"icon" + (lightTheme ? "" : " dark")}>
            <SearchIcon />
          </IconButton>
          <input
            placeholder="Search"
            className={"search-box" + (lightTheme ? "" : " dark")}
          />
        </div>

        <div className="ug-list">
          {users
            .filter((user) => user._id !== selfId) // exclude self
            .map((user) => (
              <motion.div
                key={user._id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={"list-item" + (lightTheme ? "" : " dark")}
                onClick={() => createChat(user._id)}
              >
                <p className={"con-icon" + (lightTheme ? "" : " dark")}>
                  {user.name[0]}
                </p>
                <p className={"con-title" + (lightTheme ? "" : " dark")}>
                  {user.name}
                </p>
              </motion.div>
            ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Users;
