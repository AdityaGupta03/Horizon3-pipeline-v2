"use client";
import "./actions.css";
import axios from "axios";
import React, { useState, FormEvent, useEffect } from "react";
const url = "718a-195-252-220-98.ngrok-free.app";
const actions = () => {
  type GithubLink = {
    id: string;
    name: string;
  };

  const [githubLinks, setGithubLinks] = useState<GithubLink[]>([]);
  const [selectedGithubLink, setSelectedGithubLink] = useState<string>("");
  const [githubAnalyzeError, setGithubAnalyzeError] = useState<string>("");
  const [githubAnalyzeError2, setGithubAnalyzeError2] = useState<string>("");

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

  const updateYamlContent = async (e: FormEvent) => {
    e.preventDefault();
    console.log(selectedGithubLink);
    if (selectedGithubLink) {
      setGithubAnalyzeError(
        "Please update <your_hash> to: " + selectedGithubLink
      );
      setGithubAnalyzeError2("Please update <URL> to: " + url);
      try {
        const response = await axios.get("/api/user/download_file", {
          params: { bucket: "horizon3configs", url: "example.yaml" },
          responseType: "blob", // Important for handling binary data
        });
  
        // Create a URL for the downloaded file
        console.log(response.data);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "example.yaml");
        document.body.appendChild(link);
        link.click();
      } catch (error) {
        console.error("Error downloading the file", error);
      }
    }
  };

  return (
    <div className="github-container">
      <div>
        <p>
          Please insert the yaml file into a directory .github/actions in your
          git repo. If you already have a github actions configuration, please
          refer to the sample below to update your current config.
        </p>
        <form onSubmit={updateYamlContent}>
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
          <button type="submit" className="github-submit">
            Get .yml file
          </button>
          {githubAnalyzeError && (
            <p className="error-message">{githubAnalyzeError}</p>
          )}
          {githubAnalyzeError2 && (
            <p className="error-message">{githubAnalyzeError2}</p>
          )}
        </form>
      </div>
    </div>
  );
};
export default actions;
