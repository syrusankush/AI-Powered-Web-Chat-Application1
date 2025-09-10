import React from "react";
import { useSelector } from "react-redux";

function MessageOthers({ message }) {
  const lightTheme = useSelector((state) => state.themeKey);
  if (!message) return null;

  return (
    <div className={"other-message-container" + (lightTheme ? "" : " dark")}>
      <div className={"conversation-container" + (lightTheme ? "" : " dark")}>
        <p className={"con-icon" + (lightTheme ? "" : " dark")}>
          {message.sender.name[0]}
        </p>
        <div className={"other-text-content" + (lightTheme ? "" : " dark")}>
          <p className={"con-title" + (lightTheme ? "" : " dark")}>
            {message.sender.name}
          </p>
          <p className={"con-lastMessage" + (lightTheme ? "" : " dark")}>
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MessageOthers;
