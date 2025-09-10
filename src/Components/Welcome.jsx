import React, { useEffect } from "react";
import logo from "../Images/live-chat_512px.png";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function Welcome() {
  const lightTheme = useSelector((state) => state.themeKey);
  const navigate = useNavigate();

  const userData = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    if (!userData) {
      console.log("User not Authenticated");
      navigate("/");
    }
  }, [userData, navigate]);

  if (!userData) return null; // wait until redirect

  return (
    <div className={"welcome-container" + (lightTheme ? "" : " dark")}>
      <motion.img
        drag
        whileTap={{ scale: 1.05, rotate: 360 }}
        src={logo}
        alt="Logo"
        className="welcome-logo"
      />
      <b>Hi, {userData.data.name} 👋</b>
      <p>View and text directly to people present in the chat rooms.</p>
    </div>
  );
}

export default Welcome;
