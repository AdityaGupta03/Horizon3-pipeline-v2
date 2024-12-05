"use client";
import React, { useState, FormEvent, useEffect } from "react";
import Table from "../table/page";
import "./teams.css";

const Teams = () => {
  const [teamName, setTeamName] = useState<string>("");
  const [teams, setTeams] = useState<{ team_id: string; team_name: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [teamError, setTeamError] = useState<string>("");
  const [tableData, setTableData] = useState<{ member_id: string; username: string; email: string }[]>([]);


  const user_id = sessionStorage.getItem("user_id");

  useEffect(() => {
    getTeams();
  }, []);

  const getTeams = async () => {
    try {
      const response = await fetch("/api/team/get_user_teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data);
        setTeams(data.teams);
      }
    } catch (error) {
      console.error("Error fetching Teams:", error);
    }
  };

  const handleTeamSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/team/create_team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, team_name: teamName }),
      });

      if (response.ok) {
        setTeamError("Team created successfully!");
        getTeams();
      } else {
        setTeamError("Error creating team.");
      }
    } catch (error) {
      setTeamError("Error creating team.");
    }
  };

  const handleViewTeam = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/team/get_team_members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: selectedTeam }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data);
        setTableData(data.members);
        // setTeamError("Analysis started successfully!");
      } else {
        console.log(data);
        // setGithubAnalyzeError("Error starting analysis.");
      }
    } catch (error) {
      // setGithubAnalyzeError("Error starting analysis.");
    }
  };

  return tableData.length > 0 ? (
    <div>
      <div>
      <Table data={tableData} />
      </div>
      <div className="team-container">
      <div className="team-form-container">
      <button className="team-submit" onClick={() => setTableData([])}>Back</button>
      </div>
      </div>
    </div>
  ) : (
    
    <div className="team-container">
      <div className="team-form-container">
        <h1 className="team-title">Teams</h1>
        <form onSubmit={handleTeamSubmit}>
          <div>
          <input
            type="text"
            className="team-input"
            placeholder="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          </div>
          <button type="submit" className="team-submit">Create New Team</button>
          {teamError && <p className="error-message">{teamError}</p>}
        </form>

        <form onSubmit={handleViewTeam}>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="team-select"
          >
            <option value="">Select Team</option>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>
          <button type="submit" className="team-submit">View Team</button>
          {teamError && <p className="error-message">{teamError}</p>}
        </form>
      </div>
    </div>
  );
};

export default Teams;
