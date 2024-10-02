import React, { FormEvent, useState } from "react";
import { Link, NavigateFunction, useNavigate } from "react-router-dom";

// Styling
import "./Signup.css";

// Images
import woodstock from "../Assets/background_img.png";

const Signup: React.FC = () => {
  // Define page state
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Set navigator for updating page
  const navigate: NavigateFunction = useNavigate();

  // Handler for login api
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg("");
    try {
      const response: Response = await fetch("/api/user/create_account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      console.log(response);
      const data = await response.json();
      console.log(data);

      if (response.ok) {
        sessionStorage.setItem("username", data.user.username);
        sessionStorage.setItem("email", data.user.email);
        sessionStorage.setItem("user_id", data.user.user_id);
        navigate("/verify"); // Go to home page on success
      } else {
        // TODO handle different types of errors - be more descriptive
        setErrorMsg(data.error || "An error occurred during login");
      }
    } catch (error) {
      setErrorMsg("An error occurred during login. Please try again.");
      console.log("Error calling api for account creation");
      console.error(error);
    }
  };

  return (
    <div className="signup">
      <div className="card">
        <div className="left" style={{ backgroundImage: `url(${woodstock})` }}>
          <h1>Horizon3 Pipeline</h1>
          <p>Welcome! Please create your account.</p>
          <span>Already have an account?</span>
          <Link to="/login" className="link-gen">
            <button>Login</button>
          </Link>
        </div>
        <div className="right">
          <h1>Signup</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              required
            />
            <input
              type="text"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
            />
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
            <button type="submit">Signup</button>
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

export default Signup;
