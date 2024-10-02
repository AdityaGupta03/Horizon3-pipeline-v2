import React, { FormEvent, useState } from "react";
import { Link, NavigateFunction, useNavigate } from "react-router-dom";

// Styling
import "./Verify.css";

// Images
import woodstock from "../Assets/background_img.png";

const Signup: React.FC = () => {
  // Define page state
  const [code, setCode] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const email: string | null = sessionStorage.getItem("email");

  // Set navigator for updating page
  const navigate: NavigateFunction = useNavigate();

  // Handler for login api
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg("");
    const verification_code: string = code;
    try {
      const response: Response = await fetch("/api/user/verify_email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verification_code }),
      });

      console.log(response);
      const data = await response.json();
      console.log(data);

      if (response.ok) {
        navigate("/dashboard"); // Go to home page on success
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
          <p>
            Welcome! Please verify your account (check your email for a code).
          </p>
          <span>Already have an account?</span>
          <Link to="/login" className="link-gen">
            <button>Login</button>
          </Link>
        </div>
        <div className="right">
          <h1>Verify Account</h1>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Verification Code"
              onChange={(e) => setCode(e.target.value)}
              value={code}
              required
            />
            <button type="submit">Verify Account</button>
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
