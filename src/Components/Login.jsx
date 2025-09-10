import React, { useState } from "react";
import logo from "../Images/live-chat_512px.png";
import { Backdrop, Button, CircularProgress, TextField } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Toaster from "./Toaster";

function Login() {
  const [showLogin, setShowLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    if (!formData.name || !formData.password) return setToast({ msg: "Fill all fields", key: Math.random() });
    setLoading(true);
    try {
      const config = { headers: { "Content-Type": "application/json" } };
      const response = await axios.post("http://localhost:8080/user/login/", formData, config);
      localStorage.setItem("userData", JSON.stringify(response));
      setToast({ msg: "Login successful", key: Math.random() });
      navigate("/app/welcome");
    } catch (error) {
      setToast({ msg: "Invalid username or password", key: Math.random() });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!formData.name || !formData.email || !formData.password) return setToast({ msg: "Fill all fields", key: Math.random() });
    setLoading(true);
    try {
      const config = { headers: { "Content-Type": "application/json" } };
      const response = await axios.post("http://localhost:8080/user/register/", formData, config);
      localStorage.setItem("userData", JSON.stringify(response));
      setToast({ msg: "Sign up successful", key: Math.random() });
      navigate("/app/welcome");
    } catch (error) {
      if (error.response?.status === 405) {
        setToast({ msg: "User with this email already exists", key: Math.random() });
      } else if (error.response?.status === 406) {
        setToast({ msg: "Username already taken", key: Math.random() });
      } else {
        setToast({ msg: "Sign up failed", key: Math.random() });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = (e, action) => {
    if (e.key === "Enter") action();
  };

  return (
    <>
      <Backdrop open={loading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="secondary" />
      </Backdrop>

      <div className="login-container">
        <div className="image-container">
          <img src={logo} alt="Logo" className="welcome-logo" />
        </div>

        <div className="login-box">
          {showLogin ? (
            <>
              <p className="login-text">Login to your Account</p>
              <TextField
                label="Username"
                name="name"
                variant="outlined"
                color="secondary"
                onChange={handleChange}
                onKeyDown={(e) => handleEnter(e, handleLogin)}
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                variant="outlined"
                color="secondary"
                onChange={handleChange}
                onKeyDown={(e) => handleEnter(e, handleLogin)}
              />
              <Button variant="outlined" color="secondary" onClick={handleLogin}>Login</Button>
              <p>
                Don't have an account?{" "}
                <span className="hyper" onClick={() => setShowLogin(false)}>Sign Up</span>
              </p>
            </>
          ) : (
            <>
              <p className="login-text">Create your Account</p>
              <TextField
                label="Username"
                name="name"
                variant="outlined"
                color="secondary"
                onChange={handleChange}
                onKeyDown={(e) => handleEnter(e, handleSignUp)}
              />
              <TextField
                label="Email"
                name="email"
                variant="outlined"
                color="secondary"
                onChange={handleChange}
                onKeyDown={(e) => handleEnter(e, handleSignUp)}
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                variant="outlined"
                color="secondary"
                onChange={handleChange}
                onKeyDown={(e) => handleEnter(e, handleSignUp)}
              />
              <Button variant="outlined" color="secondary" onClick={handleSignUp}>Sign Up</Button>
              <p>
                Already have an account?{" "}
                <span className="hyper" onClick={() => setShowLogin(true)}>Log In</span>
              </p>
            </>
          )}
        </div>

        {toast && <Toaster key={toast.key} message={toast.msg} />}
      </div>
    </>
  );
}

export default Login;
