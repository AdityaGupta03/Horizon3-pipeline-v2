"use client";
import React, { useState, FormEvent, useEffect } from "react";
import Table from "../table/page";
import Search from "../search/page";
import "./teams.css";

const Teams = () => {
  const [teamName, setTeamName] = useState<string>("");
  const [teams, setTeams] = useState<{ team_id: string; team_name: string; member_role: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [currentRole, setCurrentRole] = useState<string>("");
  const [teamError, setTeamError] = useState<string>("");
  const [tableData, setTableData] = useState<{ member_id: string; username: string; email: string }[]>([]);
  const [selectedMember, setSelectedMember] = useState<{ member_id: string; username: string; email: string } | null>(null);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showSearchTeam, setShowSearchTeam] = useState<boolean>(false);

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

  const handleLeave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/team/leave_team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: selectedTeam, user_id: user_id }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data);
        getTeams();
        setTableData([]);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleRemoveUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      console.log(selectedMember);
      const response = await fetch("/api/team/kick_member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: selectedTeam, user_id: selectedMember?.member_id, member_id: user_id}),
      });
      const data = await response.json();
      if (response.ok) {
        console.log(data);
        getTeams();
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
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleAddUser = () => {
    setShowSearch(true);
  };

  const handleSelectUser = async (user: { id: string; name: string; email?: string | undefined}) => {
    console.log("Selected user to add:", user);
    //add logic to add user to the team
    try {
      const response = await fetch("/api/team/add_member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: selectedTeam, add_user_id: user.id.toString() }),
      });
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        getTeams();
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
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setShowSearch(false);

    // Add logic to add user to the team
  };

  const handleSelectTeam = async (team: { id: string; name: string}) => {
    console.log("Selected team:", team);
    //add logic to add the current user to the selected team
    try {
      const response = await fetch("/api/team/add_member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: team.id.toString(), add_user_id: user_id }),
      });
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        getTeams();
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setShowSearchTeam(false);
    try {
      const response = await fetch("/api/team/get_team_members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: team.id.toString() }),
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
    setSelectedTeam(team.id.toString());
  };
 // if showSearchTeam is true, show the search component for teams
  if (showSearchTeam) {
    return (
      <Search onSelectItem={handleSelectTeam} searchType="teams" />
    );
  }
  return showSearch ? (
    <Search onSelectItem={handleSelectUser} searchType="users" />
  ) : tableData.length > 0 ? (
    <div>
      <div>
        <Table data={tableData} onRowSelect={setSelectedMember} rowClassName={(row) => (row.member_id === selectedMember?.member_id ? "selected-row" : "")} />
      </div>
      <div className="team-container">
        <div className="team-form-container">
          <div>
            <button className="team-submit" onClick={handleLeave}>Leave Team</button>
          </div>
          {selectedMember && (currentRole === "admin" || currentRole === "creator") && (
            <div>
              <button className="team-submit" onClick={handleRemoveUser}>Remove Member</button>
            </div>
          )}
          {currentRole === "admin" || currentRole === "creator" ? (
            <div>
              <button className="team-submit" onClick={handleAddUser}>Add Member</button>
            </div>
          ) : null}
          <div>
            <button className="team-submit" onClick={() => setTableData([])}>Back</button>
          </div>
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
        {/* add a button to search for a team to join */}

        <div>
          <button className="team-submit" onClick={() => setShowSearchTeam(true)}>Find a team to join</button>
        </div>

        <form onSubmit={handleViewTeam}>
          <select
            value={selectedTeam}
            onChange={(e) => {
              setSelectedTeam(e.target.value);
              var role = e.target.options[e.target.selectedIndex].getAttribute('role');
              if(role) {
                setCurrentRole(role);
              }
            }}
            className="team-select"
          >
            <option value="">Select Team</option>
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id} role={team.member_role}>
                {team.team_name}
              </option>
            ))}
          </select>
          <button type="submit" className="team-submit">View Team</button>
        </form>
      </div>
    </div>
  );
};

export default Teams;
