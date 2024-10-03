import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import axios from "axios";

const Dashboard: React.FC = () => {
  const [binary1, setBinary1] = useState<File | null>(null);
  const [binary2, setBinary2] = useState<File | null>(null);
  const [githubLink, setGithubLink] = useState<string>("");
  const [githubKey, setGithubKey] = useState<string>("");

  const [binaryError, setBinaryError] = useState<string>("");
  const [githubError, setGithubError] = useState<string>("");
  const [githubAnalyzeError, setGithubAnalyzeError] = useState<string>("");

  type GithubLink = {
    id: string;
    name: string;
  };

  const [githubLinks, setGithubLinks] = useState<GithubLink[]>([]);
  const [selectedGithubLink, setSelectedGithubLink] = useState<string>("");

  const navigate = useNavigate();
  const user_id = sessionStorage.getItem("user_id");

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    getGithubLinks();
  }, []);

  const getGithubLinks = async () => {
    try {
      const response: Response = await fetch("/api/git/get_repos_from_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setGithubLinks(data.repos);
      } else {
        console.log("Error getting github links");
      }
      console.log(githubLinks);
    } catch (error) {
      console.log("Error calling api for getting github links");
      console.error(error);
    }
  };

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

  const handleBinarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (binary1 && binary2) {
      setBinaryError("");
      let folder = "";
      try {
        const response: Response = await fetch("/api/user/create_folder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await response.json();
        folder = data.folder;
      } catch (error) {
        console.log("Error calling api for creating folder");
        console.error(error);
      }

      let formData = new FormData();
      formData.append("binary", binary1);
      formData.append("folder", folder);

      axios
        .post("/api/user/upload", formData, { headers: {} })
        .then((res) => {
          if (res.status === 200) console.log("200");
        })
        .catch((error) => {
          console.log(error);
        });

      formData = new FormData();
      formData.append("binary", binary2);
      formData.append("folder", folder);
      axios
        .post("/api/user/upload", formData, { headers: {} })
        .then((res) => {
          if (res.status === 200) console.log("200");
        })
        .catch((error) => {
          console.log(error);
        });
        try {
          const response: Response = await fetch("/api/user/run_script", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path1: folder + binary1.name,
              path2: folder + binary2.name,
            }),
          });
          const data = await response.json();
          console.log(data);
        } catch (error) {
          console.log("Error calling api for running script");
          console.error(error);
        }  
      //post request for bindiff to do its thing with folder name
    } else {
      setBinaryError("Both Binary 1 and Binary 2 must be uploaded.");
    }
  };

  const handleGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const githubUrlRegex = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/;
    const match = githubLink.match(githubUrlRegex);

    if (!match) {
      setGithubError(
        "Invalid GitHub link format. Please enter a valid GitHub repository URL.",
      );
      return;
    }

    const owner = match[1];
    const repo_name = match[2].substring(0, match[2].length - 4);
    console.log(repo_name);
    setGithubError("");

    try {
      const url = githubLink;
      const token = githubKey;
      const response: Response = await fetch("/api/git/create_git_repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, url, token, owner, repo_name }),
      });

      console.log(response);
      const data = await response.json();
      console.log(data);

      if (response.ok) {
        // Get new github repo data for dropdown
        // Say yay that worked
        setGithubError("That worked!");
        getGithubLinks();
        await delay(2000);
        setGithubError("");
      } else {
        // TODO handle different types of errors - be more descriptive
        setGithubError(
          data.error || "An error occurred when creating your repo!",
        );
      }
    } catch (error) {
      setGithubError("An error occurred when creating your repo!");
      console.log("Error calling api for creating repo");
      console.error(error);
    }
  };

  const handleExistingGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGithubLink) {
      setGithubAnalyzeError("");
      console.log("Selected Github Link: ", selectedGithubLink); //for now this should go to ish
      try {
        const repo_id = selectedGithubLink;
        const response: Response = await fetch("/api/git/analyze_repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo_id }),
        });

        console.log(response);
        const data = await response.json();
        console.log(data);

        if (response.ok) {
          // Get new github repo data for dropdown
          // Say yay that worked
          setGithubAnalyzeError("Started analysis pipeline!");
          await delay(2000);
          setGithubAnalyzeError("");
        } else {
          // TODO handle different types of errors - be more descriptive
          setGithubAnalyzeError(
            data.error || "An error occurred when creating your repo!",
          );
        }
      } catch (error) {
        setGithubAnalyzeError("An error occurred when creating your repo!");
        console.log("Error calling api for creating repo");
        console.error(error);
      }
    } else {
      setGithubAnalyzeError("Please select a GitHub link.");
    }
  };

  const isBinarySubmitDisabled = !(binary1 && binary2);
  const isGithubSubmitDisabled = !(githubLink || githubKey);

  return (
    <div className="dashboard">
      <div className="card">
        <h1>Dashboard</h1>

        <div className="button-container">
          <Link to="/useracc" className="link-gen">
            <button>User Account</button>
          </Link>
          <button onClick={handleSignOut} className="signout-btn">
            Sign Out
          </button>
        </div>
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
          <button
            type="submit"
            className="submit-btn"
            disabled={isBinarySubmitDisabled}
          >
            Submit Binaries
          </button>
          {binaryError && <p className="error">{binaryError}</p>}
        </form>

        {/* new  github stuff for ish*/}
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
          <button
            type="submit"
            className="submit-btn"
            disabled={isGithubSubmitDisabled}
          >
            Add New Git Repo
          </button>
          {githubError && <p className="error">{githubError}</p>}
        </form>

        {/* Existing GitHub Repo Submit */}
        <form
          onSubmit={handleExistingGithubSubmit}
          className="form dropdown-form"
        >
          <div className="dropdown">
            <label>Existing GitHub Link:</label>
            <select
              value={selectedGithubLink}
              onChange={(e) => setSelectedGithubLink(e.target.value)}
            >
              <option value="">Select a GitHub link</option>
              {githubLinks.map((link, index) => (
                <option key={index} value={link.id}>
                  {link.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="submit-btn">
            Analyze Git Repo
          </button>
          {githubAnalyzeError && <p className="error">{githubAnalyzeError}</p>}
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
