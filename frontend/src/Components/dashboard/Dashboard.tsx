import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const [binary1, setBinary1] = useState<File | null>(null);
  const [binary2, setBinary2] = useState<File | null>(null);
  const [githubLink, setGithubLink] = useState<string>("");
  const [githubKey, setGithubKey] = useState<string>("");

  const [binaryError, setBinaryError] = useState<string>(""); 
  const [githubError, setGithubError] = useState<string>(""); 

  const navigate = useNavigate();


  const handleSignOut = () => {
    sessionStorage.clear();
    navigate("/login");
  };


  const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBinary1(e.target.files[0]);
      setBinaryError(""); 
    }
  };

  const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBinary2(e.target.files[0]);
      setBinaryError("");
    }
  };

  const handleBinarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (binary1 && binary2) {
      setBinaryError(""); 
    } else {
      setBinaryError("Both Binary 1 and Binary 2 must be uploaded.");
    }
  };

  const handleGithubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (githubLink && githubKey) {
      setGithubError(""); 
      //submit to ish here
    } else {
      setGithubError("Both GitHub link and API key must be provided.");
    }
  };

  const isBinarySubmitDisabled = !(binary1 && binary2);
  const isGithubSubmitDisabled = !(githubLink && githubKey);

  return (
    <div className="dashboard">
      <div className="card">
        <h1>Dashboard</h1>
        <button onClick={handleSignOut} className="signout-btn">Sign Out</button>

        {/* upload binary */}
        <form onSubmit={handleBinarySubmit} className="form">
          <div className="input-group">
            <label>Upload Binary 1:</label>
            <input type="file" onChange={handleFileChange1} />
          </div>
          <div className="input-group">
            <label>Upload Binary 2:</label>
            <input type="file" onChange={handleFileChange2} />
          </div>
          <button type="submit" className="submit-btn" disabled={isBinarySubmitDisabled}>
            Submit Binaries
          </button>
          {binaryError && <p className="error">{binaryError}</p>}
        </form>

        {/* upload github stuff for ish*/}
        <form onSubmit={handleGithubSubmit} className="form">
          <div className="input-group">
            <label>GitHub Link:</label>
            <input
              type="url"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
              placeholder="https://github.com/yourrepo"
            />
          </div>
          <div className="input-group">
            <label>GitHub API Key:</label>
            <input
              type="text"
              value={githubKey}
              onChange={(e) => setGithubKey(e.target.value)}
              placeholder="Enter your GitHub API key"
            />
          </div>
          <button type="submit" className="submit-btn" disabled={isGithubSubmitDisabled}>
            Submit GitHub Info
          </button>
          {githubError && <p className="error">{githubError}</p>}
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
