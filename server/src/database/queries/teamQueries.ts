import { db_pool } from "../db.js";
import { TeamMemberPosition } from "../../types/teamMembers.type.js";

async function addTeamMemberFunc(
  team_id: number,
  member_id: number,
  member_role: TeamMemberPosition,
): Promise<boolean> {
  const query = `
    INSERT INTO team_members (member_id, team_id, member_role)
    VALUES ($1, $2, $3)
  `;

  try {
    await db_pool.query(query, [member_id, team_id, member_role]);
    return true;
  } catch (error) {
    console.error("addTeamMemberFunc(): ", error);
    return false;
  }
}

async function createTeamAndAddCreator(team_name: string, creator_id: number, repo_hash: string) {
  // TODO Migrate this to use transaction instead of manual rollback
  const createTeamQuery = `
    INSERT INTO teams (team_name)
    VALUES ($1)
    RETURNING team_id
  `;

  const rollbackQuery = `DELETE FROM teams WHERE team_id = $1`;

  try {
    var res = await db_pool.query(createTeamQuery, [team_name]);
    if (res.rows.length < 1) {
      return false;
    }

    const team_id = res.rows[0].team_id;
    var success: boolean = await addTeamMemberFunc(
      team_id,
      creator_id,
      TeamMemberPosition.Creator,
    );

    if (success) {
      const query_result = await addRepoToTeamQuery(team_id, repo_hash);
      if (!query_result) {
        success = false;
      }
    }

    if (!success) {
      await db_pool.query(rollbackQuery, [team_id]);
      console.error("Failed to add creator to team. Rollback query.");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
}

async function getTeamFromIDQuery(team_id: number) {
  const query = `
    SELECT team_id, team_name
    FROM teams
    WHERE team_id = $1
  `;

  try {
    const res = await db_pool.query(query, [team_id]);
    return res.rows[0];
  } catch (error) {
    console.error("getTeamFromIDQuery(): ", error);
    return null;
  }
}

async function getTeamsFromUserIDQuery(user_id: string) {
  
  const query = `
    SELECT tm.team_id, t.team_name, tm.member_role
    FROM teams t
    JOIN team_members tm ON t.team_id = tm.team_id
    WHERE tm.member_id = $1 and tm.member_role != 'requested'
  `;

  try {
    const res = await db_pool.query(query, [user_id]);
    return res.rows;
  } catch (error) {
    console.error("getTeamsFromUserIDQuery(): ", error);
    return null;
  }
}

async function requestToJoinTeamQuery(team_id: number, user_id: number) {
  try {
    return await addTeamMemberFunc(
      team_id,
      user_id,
      TeamMemberPosition.Requested,
    );
  } catch (error) {
    console.error("requestToJoinTeamQuery(): ", error);
    return false;
  }
}

async function getTeamAdminsAndCreatorsQuery(team_id: number) {
  const query = `
    SELECT member_id, u.username, u.email
    FROM team_members tm
    JOIN users u ON tm.member_id = u.user_id
    WHERE team_id = $1 AND member_role IN ($2, $3)
  `;

  try {
    const res = await db_pool.query(query, [
      team_id,
      TeamMemberPosition.Creator,
      TeamMemberPosition.Admin,
    ]);
    return res.rows;
  } catch (error) {
    console.error("getTeamAdminsAndCreatorsQuery(): ", error);
    return null;
  }
}

async function removeTeamMemberQuery(
  team_id: number,
  user_id: number,
  member_id: number,
) {
  const query = `
    DELETE FROM team_members
    WHERE member_id = $1
    AND team_id = $2
    AND EXISTS (
      SELECT 1
      FROM team_members
      WHERE member_id = $3
      AND team_id = $2
      AND member_role IN ('creator', 'admin')
    )
  `;

  try {
    await db_pool.query(query, [user_id, team_id, member_id]);
    return true;
  } catch (error) {
    console.error("removeTeamMemberQuery(): ", error);
    return false;
  }
}

async function leaveTeamQuery(team_id: number, user_id: number) {
  const query = `
    DELETE FROM team_members
    WHERE member_id = $1 AND team_id = $2
  `;

  try {
    await db_pool.query(query, [user_id, team_id]);
    return true;
  } catch (error) {
    console.error("leaveTeamQuery(): ", error);
    return false;
  }
}

async function getPendingMemberApprovalsQuery(team_id: number) {
  const query = `
    SELECT member_id, u.username, u.email
    FROM team_members tm
    JOIN users u ON tm.member_id = u.user_id
    WHERE team_id = $1 AND member_role = 'requested'
  `;

  try {
    const res = await db_pool.query(query, [team_id]);
    return res.rows;
  } catch (error) {
    console.error("getPendingMemberApprovalsQuery(): ", error);
    return null;
  }
}

async function approveMemberRequest(team_id: number, member_id: number) {
  const query = `
    UPDATE team_members
    SET member_role = 'member'
    WHERE team_id = $1 AND member_id = $2
  `;

  try {
    await db_pool.query(query, [team_id, member_id]);
    return true;
  } catch (error) {
    console.error("approveMemberRequest(): ", error);
    return false;
  }
}

// add a function to get members of a given team
async function getTeamMembersQuery(team_id: number) {
  const query = `
    SELECT member_id, u.username, u.email
    FROM team_members tm
    JOIN users u ON tm.member_id = u.user_id
    WHERE team_id = $1 and tm.member_role != 'requested'
  `;

  try {
    const res = await db_pool.query(query, [team_id]);
    return res.rows;
  } catch (error) {
    console.error("getTeamMembersQuery(): ", error);
    return null;
  }
} 

// add a function to add a user to a team as a member
async function addTeamMemberQuery(team_id: number, user_id: number) {
  try {
    const success: boolean = await addTeamMemberFunc(
      team_id,
      user_id,
      TeamMemberPosition.Member,
    );

    if (!success) {
      console.error("Failed to add creator to team. Rollback query.");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
}

// add a function to get the team id and team name of all teams
async function getAllTeamsQuery() {
  const query = `
    SELECT team_id, team_name
    FROM teams
  `;

  try {
    const res = await db_pool.query(query);
    return res.rows;
  } catch (error) {
    console.error("getAllTeamsQuery(): ", error);
    return null;
  }
}

async function addRepoToTeamQuery(team_id: number, repo_hash: string) {
  const query = `
    INSERT INTO team_repos (team_id, repo_hash)
    VALUES ($1, $2)
  `;

  try {
    await db_pool.query(query, [team_id, repo_hash]);
    return true;
  } catch (error) {
    console.error("linkTeamToRepo(): ", error);
    return false;
  }
}


export {
  createTeamAndAddCreator,
  getTeamsFromUserIDQuery,
  requestToJoinTeamQuery,
  getTeamAdminsAndCreatorsQuery,
  getTeamFromIDQuery,
  removeTeamMemberQuery,
  leaveTeamQuery,
  getPendingMemberApprovalsQuery,
  approveMemberRequest,
  getTeamMembersQuery,
  addTeamMemberQuery,
  getAllTeamsQuery,
  addRepoToTeamQuery
};
