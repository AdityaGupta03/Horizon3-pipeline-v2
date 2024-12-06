"use client";
import React, { useState, FormEvent, useEffect } from "react";
import "./github.css";

const Github = () => {
  const [githubLink, setGithubLink] = useState<string>("");
  const [githubKey, setGithubKey] = useState<string>("");
  const [githubLinks, setGithubLinks] = useState<{ id: string; name: string }[]>([]);
  const [selectedGithubLink, setSelectedGithubLink] = useState<string>("");
  const [githubError, setGithubError] = useState<string>("");
  const [githubAnalyzeError, setGithubAnalyzeError] = useState<string>("");
  const [analysisType, setAnalysisType] = useState<string>("");
  const [llmType, setLlmType] = useState<string>("");
  const [repoType, setRepoType] = useState<string>("");

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
    
    // Reset error message
    setGithubError("");
    
    // Validate repository type selection
    if (!repoType) {
      setGithubError("Please select a repository type.");
      return;
    }

    // Validate repository link
    if (!githubLink) {
      setGithubError("Please enter a GitHub repository link.");
      return;
    }

    const match = githubLink.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+?)(\.git)?$/);
    if (!match) {
      setGithubError("Invalid GitHub repository link format. Expected: https://github.com/owner/repo");
      return;
    }
    
    const [_, owner, repo_name] = match;
    const cleanRepoName = repo_name.replace(/\.git$/, '');
    
    // Validate API key for private repositories
    if (repoType === "private") {
      if (!githubKey || githubKey.trim() === "") {
        setGithubError("API Key is required for private repositories.");
        return;
      }
      if (githubKey.length < 40) {  // GitHub personal access tokens are typically 40+ characters
        setGithubError("Invalid API Key format. Please check your GitHub personal access token.");
        return;
      }
    }

    try {
      const response = await fetch("/api/git/create_git_repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id, 
          url: githubLink, 
          token: repoType === "private" ? githubKey : null,
          owner, 
          repo_name: cleanRepoName,
          is_private: repoType === "private"
        }),
      });

      if (response.ok) {
        setGithubError("Repository added successfully!");
        // Clear form
        setGithubLink("");
        setGithubKey("");
        setRepoType("");
        getGithubLinks();
      } else {
        const errorData = await response.json();
        setGithubError(errorData.message || "Error adding repository.");
      }
    } catch (error) {
      setGithubError("Error connecting to server. Please try again.");
    }
  };

  const handleExistingGithubSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedGithubLink || !analysisType || !llmType) {
      setGithubAnalyzeError("Please select all options before analyzing.");
      return;
    }

    try {
      const response = await fetch("/api/git/analyze_repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          repo_id: selectedGithubLink,
          analysis_type: analysisType,
          llm_type: llmType
        }),
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
    <div className="github-container">
      <div className="github-form-container">
        <h1 className="github-title">GitHub Integration</h1>
        <form onSubmit={handleGithubSubmit}>
          <select
            required
            value={repoType}
            onChange={(e) => setRepoType(e.target.value)}
            className="github-select"
          >
            <option value="" disabled>Choose Repository Access Type</option>
            <option value="public">Repository Only (Public)</option>
            <option value="private">Repository + API Key (Private)</option>
          </select>

          <div>
            <input
              type="url"
              className="github-input"
              placeholder="GitHub Repository Link"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
              required
            />
          </div>
          
          {repoType === "private" && (
            <div>
              <input
                type="text"
                className="github-input"
                placeholder="GitHub API Key"
                value={githubKey}
                onChange={(e) => setGithubKey(e.target.value)}
                required
              />
            </div>
          )}
          
          <button type="submit" className="github-submit">Add Repository</button>
          {githubError && <p className="error-message">{githubError}</p>}
        </form>

        <form onSubmit={handleExistingGithubSubmit}>
          <select
            required
            value={selectedGithubLink}
            onChange={(e) => setSelectedGithubLink(e.target.value)}
            className="github-select"
          >
            <option value="" disabled>Choose Repository</option>
            {githubLinks.map((link) => (
              <option key={link.id} value={link.id}>
                {link.name}
              </option>
            ))}
          </select>

          <select
            required
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
            className="github-select"
          >
            <option value="" disabled>Choose Static Analysis Tool</option>
            <option value="sonarqube">SonarQube</option>
            <option value="codeql">CodeQL</option>
          </select>

          <select
            required
            value={llmType}
            onChange={(e) => setLlmType(e.target.value)}
            className="github-select"
          >
            <option value="" disabled>Choose LLM Type</option>
            <option value="gemini">Gemini</option>
            <option value="gpt">GPT</option>
          </select>

          <button type="submit" className="github-submit">Analyze Repository</button>
          {githubAnalyzeError && <p className="error-message">{githubAnalyzeError}</p>}
        </form>
      </div>
    </div>
  );
};

export default Github;
