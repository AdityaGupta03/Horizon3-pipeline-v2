"use client";
import "./reports.css";
import axios from "axios";
import React, { FormEvent, useEffect, useState } from "react";
import { get } from "http";

const Reports = () => {
  const user_id = sessionStorage.getItem("user_id");
  useEffect(() => {
    getReports();
  }, []);
  const [reports, setReports] = useState<
    { id: string; name: string; vuln: Number }[]
  >([]);
  const [selectedReport, setSelectedReport] = useState<string>("");

  const getReports = async () => {
    try {
      const response = await fetch("/api/user/get_reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });
      const data = await response.json();
      console.log(data.reports);
      if (response.ok) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Error fetching GitHub links:", error);
    }
    console.log(reports);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log(selectedReport);
    try {
      const response = await axios.get("/api/user/download_file", {
        params: { url: selectedReport },
        responseType: "blob", // Important for handling binary data
      });

      // Create a URL for the downloaded file
      console.log(response.data);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", selectedReport);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error downloading the file", error);
    }
  };

  const handleDelete = async (e: FormEvent) => { 
    e.preventDefault();
    console.log(selectedReport);
    try {
      const response = await fetch("/api/user/delete_file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: selectedReport }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data);
        try {
          const response = await fetch("/api/user/remove_report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: selectedReport }),
          });
          const data = await response.json();
          if (response.ok) {
            console.log(data);
            getReports();
          }
        } catch (error) {
          console.error("Error:", error);
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-form-container">
        <h1 className="reports-title">Report Download</h1>
        <form onSubmit={handleSubmit}>
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            className="reports-select"
          >
            <option value="">Select Report</option>
            {reports.map((report) => (
              <option key={report.id} value={report.name}>
                {report.vuln === 1 && "(High Prio) "}
                {report.name}
              </option>
            ))}
          </select>
          <button onClick={handleSubmit} className="reports-submit">Download</button>
           <button onClick={handleDelete} className="reports-submit">Delete</button>
        </form>
      </div>
    </div>

    // <div className="github-container">
    //   <div className="github-form-container">
    //     <h1 className="github-title">GitHub Integration</h1>
    //     <form onSubmit={handleGithubSubmit}>
    //       <div>
    //       <input
    //         type="url"
    //         className="github-input"
    //         placeholder="GitHub Repository Link"
    //         value={githubLink}
    //         onChange={(e) => setGithubLink(e.target.value)}
    //       />
    //       </div>
    //       <div>
    //       <input
    //         type="text"
    //         className="github-input"
    //         placeholder="GitHub API Key"
    //         value={githubKey}
    //         onChange={(e) => setGithubKey(e.target.value)}
    //       />
    //       </div>
    //       <button type="submit" className="github-submit">Add Repository</button>
    //       {githubError && <p className="error-message">{githubError}</p>}
    //     </form>

    //     <form onSubmit={handleExistingGithubSubmit}>
    //       <select
    //         value={selectedGithubLink}
    //         onChange={(e) => setSelectedGithubLink(e.target.value)}
    //         className="github-select"
    //       >
    //         <option value="">Select Repository</option>
    //         {githubLinks.map((link) => (
    //           <option key={link.id} value={link.id}>
    //             {link.name}
    //           </option>
    //         ))}
    //       </select>
    //       <button type="submit" className="github-submit">Analyze Repository</button>
    //       {githubAnalyzeError && <p className="error-message">{githubAnalyzeError}</p>}
    //     </form>
    //   </div>
    // </div>
  );
};

export default Reports;
