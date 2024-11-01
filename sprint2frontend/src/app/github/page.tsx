"use client";
import React, { useState, FormEvent, useEffect } from "react";
// import "./Github.css"; // Create relevant styles if needed

const Github = () => {
  const [githubLink, setGithubLink] = useState<string>("");
  const [githubKey, setGithubKey] = useState<string>("");
  const [githubLinks, setGithubLinks] = useState<{ id: string; name: string }[]>([]);
  const [selectedGithubLink, setSelectedGithubLink] = useState<string>("");
  const [githubError, setGithubError] = useState<string>("");
  const [githubAnalyzeError, setGithubAnalyzeError] = useState<string>("");

  const user_id = sessionStorage.getItem("user_id");

  useEffect(() => {
    getGithubLinks();
  }, []);

  const getGithubLinks = async () => {
    try {
      const response = await fetch("/api/git/get_repos_from_user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });
      const data = await response.json();
      if (response.ok) {
        setGithubLinks(data.repos);
      }
    } catch (error) {
      console.error("Error fetching GitHub links:", error);
    }
  };

  const handleGithubSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const match = githubLink.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)$/);
    if (!match) {
      setGithubError("Invalid GitHub link.");
      return;
    }

    const [_, owner, repo_name] = match;
    try {
      const response = await fetch("/api/git/create_git_repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, url: githubLink, token: githubKey, owner, repo_name }),
      });

      if (response.ok) {
        setGithubError("Repository added successfully!");
        getGithubLinks();
      } else {
        setGithubError("Error adding repository.");
      }
    } catch (error) {
      setGithubError("Error adding repository.");
    }
  };

  const handleExistingGithubSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/git/analyze_repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_id: selectedGithubLink }),
      });

      if (response.ok) {
        setGithubAnalyzeError("Analysis started successfully!");
      } else {
        setGithubAnalyzeError("Error starting analysis.");
      }
    } catch (error) {
      setGithubAnalyzeError("Error starting analysis.");
    }
  };

  return (
    <div>
      <h1>GitHub Integration</h1>
      <form onSubmit={handleGithubSubmit}>
        <input
          type="url"
          placeholder="GitHub Repository Link"
          value={githubLink}
          onChange={(e) => setGithubLink(e.target.value)}
        />
        <input
          type="text"
          placeholder="GitHub API Key"
          value={githubKey}
          onChange={(e) => setGithubKey(e.target.value)}
        />
        <button type="submit">Add Repository</button>
        {githubError && <p>{githubError}</p>}
      </form>
      <form onSubmit={handleExistingGithubSubmit}>
        <select
          value={selectedGithubLink}
          onChange={(e) => setSelectedGithubLink(e.target.value)}
        >
          <option value="">Select Repository</option>
          {githubLinks.map((link) => (
            <option key={link.id} value={link.id}>
              {link.name}
            </option>
          ))}
        </select>
        <button type="submit">Analyze Repository</button>
        {githubAnalyzeError && <p>{githubAnalyzeError}</p>}
      </form>
    </div>
  );
};

export default Github;
