import React from "react";
import "./App.css";
import MainContainer from "./Components/MainContainer";
import Login from "./Components/Login";
import { Route, Routes } from "react-router-dom";
import Welcome from "./Components/Welcome";
import ChatArea from "./Components/ChatArea";
import Users from "./Components/Users";
import CreateGroups from "./Components/CreateGroups";
import Groups from "./Components/Groups";
import AIChat from "./Components/AIChat";
import { useSelector } from "react-redux";
import errorBoundary from "./Components/errorBoundary";
function App() {
  const lightTheme = useSelector((state) => state.themeKey);

  return (
    <div className={"App" + (lightTheme ? "" : "-dark")}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="app" element={<MainContainer />}>
          <Route path="welcome" element={<Welcome />} />
          {/* Nested route relative to MainContainer */}
          <Route path="/app/chat/:id" element={<ChatArea />} />
          <Route path="users" element={<Users />} />
          <Route path="groups" element={<Groups />} />
          <Route path="create-groups" element={<CreateGroups />} />
          <Route path="ai-chat/:chatId?" element={<AIChat />} />
          <Route
  path="/app/chat/:id"
  element={
    <errorBoundary>
      <ChatArea />
    </errorBoundary>
  }
/>
        </Route>
        {/* Fallback route */}
        <Route path="*" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
