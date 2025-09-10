import React from "react";

function MessageSelf({ message }) {
  if (!message) return null;

  return (
    <div className="self-message-container">
      <div className="messageBox">
        <p>{message.content}</p>
        {/* Optional timestamp */}
        {/* <p className="self-timeStamp">{new Date(message.createdAt).toLocaleTimeString()}</p> */}
      </div>
    </div>
  );
}

export default MessageSelf;
