// src/app/dashboard/page.tsx
"use client";
import React from "react";
import "./dashboard.css";

const Dashboard = () => {
  const email = typeof window !== "undefined" ? sessionStorage.getItem("email") : null;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="padlock">
          <div className="padlock__hook">
            <div className="padlock__hook-body"></div>
            <div className="padlock__hook-body"></div>
          </div>
          <div className="padlock__body">
            <div className="padlock__face">
              <div className="padlock__eye padlock__eye--left"></div>
              <div className="padlock__eye padlock__eye--right"></div>
              <div className="padlock__mouth padlock__mouth--one"></div>
            </div>
          </div>
        </div>
        <h1 className="dashboard-title">Welcome to the dashboard, {email}.</h1>
        <h1 className="dashboard-title">Upload a GitHub link or upload binaries.</h1>
      </div>
    </div>
  );
};

export default Dashboard;
