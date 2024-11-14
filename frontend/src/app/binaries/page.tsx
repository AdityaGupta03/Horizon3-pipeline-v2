// src/app/binaries/page.tsx
"use client";

import React, { useState, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import "./binaries.css";

const Binary = () => {
  const [binary1, setBinary1] = useState<File | null>(null);
  const [binary2, setBinary2] = useState<File | null>(null);
  const [binaryError, setBinaryError] = useState<string>("");

  const user_id = sessionStorage.getItem("user_id");

  const handleFileChange1 = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBinary1(e.target.files[0]);
      setBinaryError("");
    }
  };

  const handleFileChange2 = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBinary2(e.target.files[0]);
      setBinaryError("");
    }
  };

  const handleBinarySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (binary1 && binary2 && binary1.name !== binary2.name) {
      setBinaryError("Uploading binaries...");
      let folder = "";
      try {
        const response = await fetch("/api/user/create_folder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await response.json();
        folder = data.folder;
      } catch (error) {
        setBinaryError("Error creating folder.");
        return;
      }

      let formData = new FormData();
      formData.append("binary", binary1);
      formData.append("folder", folder);

      try {
        await axios.post("/api/user/upload", formData);
        formData = new FormData();
        formData.append("binary", binary2);
        formData.append("folder", folder);

        await axios.post("/api/user/upload", formData);

        await fetch("/api/user/run_docker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folder,
            path1: binary1.name,
            path2: binary2.name,
          }),
        });
        setBinaryError("Binaries uploaded successfully!");
      } catch (error) {
        setBinaryError("Error uploading binaries.");
      }
    } else {
      setBinaryError("Both binaries must be uploaded and different.");
    }
  };

  return (
    <div className="binary-container">
      <div className="binary-form">
        <h1>Binary Upload</h1>
        <form onSubmit={handleBinarySubmit}>
          <div className="binary-field">
            <label>Upload Binary 1:</label>
            <input className="binary-input" type="file" onChange={handleFileChange1} />
          </div>
          <div className="binary-field">
            <label>Upload Binary 2:</label>
            <input className="binary-input" type="file" onChange={handleFileChange2} />
          </div>
          <button className="binary-submit" type="submit">Submit Binaries</button>
          {binaryError && <p className="error-message">{binaryError}</p>}
        </form>
      </div>
    </div>
  );
};

export default Binary;
