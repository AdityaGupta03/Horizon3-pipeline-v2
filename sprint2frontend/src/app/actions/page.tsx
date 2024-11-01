"use client";
import "./actions.css";
import React, { useState, FormEvent, useEffect } from "react";
import yaml from 'js-yaml';
const yamlContent = `
name: H3-Pipeline-Analysis

on:
  push:
    branches:
      - main

jobs:
  call-local-api:
    runs-on: ubuntu-latest

    steps:
      - name: Make API call to local server
        run: |
          # Use curl to call the API endpoint, for example:
          curl -X POST "https://19e3-128-210-106-54.ngrok-free.app/api/git/analyze_repo" -H "Content-Type: application/json" -d '{"repo_id": "hash_goes_here"}'
`;


const actions = () => {
    type YamlData = Record<string, any> | null;
    const [data, setData] = useState<YamlData>(null);
  const [githubLink, setGithubLink] = useState<string>("");
  const [githubKey, setGithubKey] = useState<string>("");
  const [githubLinks, setGithubLinks] = useState<{ id: string; name: string }[]>([]);
  const [selectedGithubLink, setSelectedGithubLink] = useState<string>("");
  const [githubError, setGithubError] = useState<string>("");
  const [githubAnalyzeError, setGithubAnalyzeError] = useState<string>("");

  const user_id = sessionStorage.getItem("user_id");

  useEffect(() => {
    getGithubLinks();
    const yamlData = yaml.load(yamlContent) as Record<string, any>; // Parse YAML to JSON
    setData(yamlData);
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

  const handleExistingGithubSubmit = async (e: FormEvent) => {
    
  };

  return (
    <div className="github-container">
      
        <form onSubmit={handleExistingGithubSubmit}>
          <select
            value={selectedGithubLink}
            onChange={(e) => setSelectedGithubLink(e.target.value)}
            className="github-select"
          >
            <option value="">Select Repository</option>
            {githubLinks.map((link) => (
              <option key={link.id} value={link.id}>
                {link.name}
              </option>
            ))}
          </select>
          <button type="submit" className="github-submit">Get .yml file</button>
          {githubAnalyzeError && <p className="error-message">{githubAnalyzeError}</p>}
        </form>
        <pre>{data ? JSON.stringify(data, null, 2) : "Loading..."}</pre>
      </div>
  );
};
export default actions;
