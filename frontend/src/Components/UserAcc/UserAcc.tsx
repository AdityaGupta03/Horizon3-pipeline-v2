import React, { FormEvent, useState } from "react";
import { Link, NavigateFunction, useNavigate } from "react-router-dom";

// Styling
import "./UserAcc.css";

// Images
// import woodstock from "../Assets/background_img.png";

const UserAcc: React.FC = () => {
  // Define page state
  const [new_username, setNewUsername] = useState<string>("");
  const [userErrorMsg, setUserErrorMsg] = useState<string>("");
  const [new_password, setNewPassword] = useState<string>("");
  const [old_password, setOldPassword] = useState<string>("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string>("");
  const [delete_confirm, setDeleteConfirm] = useState<string>("");
  const [deleteErrorMsg, setdeleteErrorMsg] = useState<string>("");

  const user_id: string | null = sessionStorage.getItem("user_id");
  const username: string | null = sessionStorage.getItem("username");

  // Set navigator for updating page
  const navigate: NavigateFunction = useNavigate();

  // Handler for change username api
  const handleChangeUsernameSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setUserErrorMsg("");
    try {
      const response: Response = await fetch("/api/user/change_username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, new_username }),
      });

      console.log(response);
      const data = await response.json();
      console.log(data);

      if (response.ok) {
        sessionStorage.setItem("username", new_username);
        setUserErrorMsg(`Success! Your new username is: ${new_username}`);
      } else {
        // TODO handle different types of errors - be more descriptive
        setUserErrorMsg(data.error || "An error occurred during login");
      }
    } catch (error) {
      setUserErrorMsg("An error occurred during login. Please try again.");
      console.log("Error calling api for account login");
      console.error(error);
    }
  };

       // Password validation
  const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return passwordRegex.test(password);
  };
  const handleChangePasswordSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPasswordErrorMsg("");

    // Validate password constraints
    if (!validatePassword(new_password)) {
      setPasswordErrorMsg(
        "Password must start with an uppercase letter, contain at least one digit, one special character, and be at least 8 characters long."
      );
      return;
    }
    try {
      const response: Response = await fetch("/api/user/change_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, old_password, new_password }),
      });

      console.log(response);
      const data = await response.json();
      console.log(data);

      if (response.ok) {
        setPasswordErrorMsg("Success!");
      } else {
        // TODO handle different types of errors - be more descriptive
        setPasswordErrorMsg(data.error || "An error occurred during login");
      }
    } catch (error) {
      setPasswordErrorMsg("An error occurred during login. Please try again.");
      console.log("Error calling api for account login");
      console.error(error);
    }
  };

  const handleDeleteAccountSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setdeleteErrorMsg("");

    if (username !== delete_confirm) {
      setdeleteErrorMsg("Username provided does not match your username!");
      return;
    }

    try {
      const response: Response = await fetch("/api/user/delete_account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });

      console.log(response);
      const data = await response.json();
      console.log(data);

      if (response.ok) {
        sessionStorage.clear();
        navigate("/signup");
      } else {
        // TODO handle different types of errors - be more descriptive
        setPasswordErrorMsg(data.error || "An error occurred during login");
      }
    } catch (error) {
      setPasswordErrorMsg("An error occurred during login. Please try again.");
      console.log("Error calling api for account login");
      console.error(error);
    }
  };
  return (
    <div className="user-acc">
      <div>
        <Link to="/dashboard" className="link-gen">
          <button>Back to Dashboard</button>
        </Link>
      </div>
      <div className="ChangeUsername">
        <h1>Change Username</h1>
        <form onSubmit={handleChangeUsernameSubmit}>
          <input
            type="text"
            placeholder="New Username"
            onChange={(e) => setNewUsername(e.target.value)}
            value={new_username}
            required
          />
          <button type="submit">Change Username</button>
        </form>
        {userErrorMsg && (
          <div>
            <p>{userErrorMsg}</p>
          </div>
        )}
      </div>
      <div className="ChangePassword">
        <h1>Change Password</h1>
        <form onSubmit={handleChangePasswordSubmit}>
          <input
            type="password"
            placeholder="Old Password"
            onChange={(e) => setOldPassword(e.target.value)}
            value={old_password}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            onChange={(e) => setNewPassword(e.target.value)}
            value={new_password}
            required
          />
          <button type="submit">Change Password</button>
        </form>
        {passwordErrorMsg && (
          <div>
            <p>{passwordErrorMsg}</p>
          </div>
        )}
      </div>
      <div className="DeleteAccount">
        <h1>Delete Account</h1>
        <h2>Insert your username into the field below to confirm deletion!</h2>
        <form onSubmit={handleDeleteAccountSubmit}>
          <input
            type="text"
            placeholder="Type your username here!"
            onChange={(e) => setDeleteConfirm(e.target.value)}
            value={delete_confirm}
            required
          />
          <button type="submit">Delete Account</button>
        </form>
        {deleteErrorMsg && (
          <div>
            <p>{deleteErrorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
  
};

export default UserAcc;
