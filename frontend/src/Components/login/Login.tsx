import React, { FormEvent, useState } from "react";
import { Link, NavigateFunction, useNavigate } from "react-router-dom";

// Styling
import "./Login.css";

// Images
import woodstock from "../Assets/background_img.png";

const Login: React.FC = () => {
  // Define page state
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Set navigator for updating page
  const navigate: NavigateFunction = useNavigate();

  // Delay script
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Handler for login api
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg("");
    try {
      const response: Response = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      console.log(response);
      const data = await response.json();
      console.log(data);

      if (response.ok) {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("user_id", data.user_id);
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("email", data.email);
        navigate("/dashboard"); // Go to home page on success
      } else if (response.status === 403) {
        setErrorMsg(
          "Account is not validated... Routing you to verification page!",
        );
        sessionStorage.setItem("email", data.email);
        await delay(3000);
        navigate("/verify");
      } else {
        // TODO handle different types of errors - be more descriptive
        setErrorMsg(data.error || "An error occurred during login");
      }
    } catch (error) {
      setErrorMsg("An error occurred during login. Please try again.");
      console.log("Error calling api for account login");
      console.error(error);
    }
  };

  return (
    <div className="login">
      <div className="card">
        <div className="left" style={{ backgroundImage: `url(${woodstock})` }}>
          <h1>Horizon3 Pipeline</h1>
          <p>Welcome back! Please login to your account.</p>
          <span>Don't have an account?</span>
          <Link to="/signup" className="link-gen">
            <button>Register</button>
          </Link>
        </div>
        <div className="right">
          <h1>Login</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              required
            />
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
            <button type="submit">Login</button>
          </form>
          {errorMsg && (
            <div>
              <p>{errorMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
