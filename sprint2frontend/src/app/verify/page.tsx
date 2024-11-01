"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import "./Verify.css"; // Adjust CSS file path as necessary

const Verify: React.FC = () => {
  const [code, setCode] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const router = useRouter();
  const email = sessionStorage.getItem("email");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg("");

    try {
      const response = await fetch("/api/user/verify_email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, verification_code: code }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/dashboard"); // Go to dashboard on success
      } else {
        setErrorMsg(data.error || "Verification failed");
      }
    } catch (error) {
      setErrorMsg("An error occurred during verification. Please try again.");
      console.error("Error during verification API call", error);
    }
  };

  return (
    <div className="verify">
      <h1>Horizon3 Pipeline</h1>
      <p>Welcome! Please verify your account using the code sent to your email.</p>
      <span>Already have an account?</span>
      <a href="/login" className="link-gen">
        <button>Login</button>
      </a>
      <div className="verify-form">
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
          {errorMsg && <p className="error">{errorMsg}</p>}
        </form>
      </div>
    </div>
  );
};

export default Verify;
