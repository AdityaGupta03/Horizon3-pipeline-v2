import { db_pool } from "../db.js";
import { TeamMemberPosition } from "../../types/teamMembers.type.js";

async function addTeamMemberFunc(
  team_id: number,
  creator_id: number,
  member_role: TeamMemberPosition,
): Promise<boolean> {
  const query = `
    INSERT INTO team_members (member_id, team_id, member_role)
    VALUES ($1, $2, $3)
  `;

  try {
    await db_pool.query(query, [creator_id, team_id, member_role]);
    return true;
  } catch (error) {
    console.error("addTeamMemberFunc(): ", error);
    return false;
  }
}

async function createTeamAndAddCreator(team_name: string, creator_id: number) {
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
    const success: boolean = await addTeamMemberFunc(
      team_id,
      creator_id,
      TeamMemberPosition.Creator,
    );

    if (!success) {
      await db_pool.query(rollbackQuery, [team_id]);
      console.error("Failed to add creator to team. Rollback query.");
      return false;
    }
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
}

async function getTeamFromIDQuery(team_id: Number) {
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
    SELECT team_id, team_name
    FROM teams
    WHERE team_id IN (
      SELECT team_id
      FROM team_members
      WHERE member_id = $1
    )
  `;

  try {
    const res = await db_pool.query(query, [user_id]);
    return res.rows;
  } catch (error) {
    console.error("getTeamsFromUserIDQuery(): ", error);
    return null;
  }
}

async function requestToJoinTeamQuery(team_id: Number, user_id: Number) {
  const query = `
    INSERT INTO team_members (member_id, team_id, member_role)
    VALUES ($1, $2, $3)
  `;

  try {
    await db_pool.query(query, [
      user_id,
      team_id,
      TeamMemberPosition.Requested,
    ]);
    return true;
  } catch (error) {
    console.error("requestToJoinTeamQuery(): ", error);
    return false;
  }
}

async function getTeamAdminsAndCreatorsQuery(team_id: Number) {
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
  team_id: Number,
  user_id: Number,
  member_id: Number,
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

async function leaveTeamQuery(team_id: Number, user_id: Number) {
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

export {
  createTeamAndAddCreator,
  getTeamsFromUserIDQuery,
  requestToJoinTeamQuery,
  getTeamAdminsAndCreatorsQuery,
  getTeamFromIDQuery,
  removeTeamMemberQuery,
  leaveTeamQuery,
};
