// src/app/AuthForm.tsx
"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import "./AuthForm.css"; // Import CSS for styling

const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const router = useRouter();

  const togglePanel = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg(""); // Clear error message when toggling
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("user_id", data.user_id);
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("email", data.email);
        router.replace("/dashboard");
      } else {
        setErrorMsg(data.error || "Login failed. Try again.");
      }
    } catch (error) {
      setErrorMsg("An error occurred during login. Please try again.");
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Password validation
    const validatePassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!validatePassword.test(password)) {
      setErrorMsg("Password must include an uppercase letter, a digit, a special character, and be at least 8 characters.");
      return;
    }

    try {
      const response = await fetch("/api/user/create_account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("user_id", data.user_id);
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("email", data.email);
        router.replace("/verify");
      } else {
        setErrorMsg(data.error || "Signup failed. Try again.");
      }
    } catch (error) {
      setErrorMsg("An error occurred during signup. Please try again.");
    }
  };

  return (
  <div className="vertical-center">
    <div className={`container ${isSignUp ? "right-panel-active" : ""}`} id="container">
      <div className="form-container sign-up-container">
        <form onSubmit={handleSignup}>
          <h1>Create Account</h1>
          <div>
            <input
              type="text"
              className="form__field"
              placeholder="Username"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {/* <label htmlFor="username" className="form__label">Username</label> */}
          </div>
          <div>
          <input
            type="email"
            className="form__field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          </div>
          <div>
          <input
            type="password"
            className="form__field"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          </div>
          <button type="submit">Sign Up</button>
          {errorMsg && <p className="error">{errorMsg}</p>}
        </form>
      </div>

    {isSignUp ? (<div></div>) : (<div className="form-container sign-in-container">
        <form onSubmit={handleLogin}>
          <h1>Sign in</h1>
          <div>
          <input
            type="text"
            className="form__field"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          </div>
          <div>
          <input
            type="password"
            className="form__field"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          </div>
          <button type="submit">Sign In</button>
          {errorMsg && <p className="error">{errorMsg}</p>}
        </form>
      </div>)}
      

      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <h1>Welcome</h1>
            <p>Have an account? Sign in!</p>
            <button className="ghost" onClick={togglePanel}>Sign In</button>
          </div>
          <div className="overlay-panel overlay-right">
            <h1>Welcome</h1>
            <p>Don't have an account? Sign Up</p>
            <button className="ghost" onClick={togglePanel}>Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default AuthForm;