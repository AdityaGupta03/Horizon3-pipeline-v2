import { db_pool } from "../db.js";

async function createUserRepo(
  user_id,
  url,
  priv_flag,
  token,
  name,
  owner,
  repo_hash,
) {
  const query = `
    INSERT INTO repos (github_url, token, creator_id, private, name, owner, hash)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `;

  try {
    const result = await db_pool.query(query, [
      url,
      token,
      user_id,
      priv_flag,
      name,
      owner,
      repo_hash,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating repo:", error);
    throw error;
  }
}

async function deleteRepoQueryFromHash(user_id, repo_hash) {
  const query = `
    DELETE FROM repos WHERE hash=$1 and creator_id=$2
  `;
  console.log(query);
  console.log(repo_hash);
  console.log(user_id);
  try {
    const result = await db_pool.query(query, [repo_hash, user_id]);

    return result.rowCount > 0;
  } catch (error) {
    console.error("Error deleting repos query", error);
    throw error;
  }
}

async function getReposFromUserID(user_id) {
  const query = `
    SELECT * FROM repos WHERE creator_id=$1;
  `;

  try {
    const result = await db_pool.query(query, [user_id]);
    return result.rows;
  } catch (error) {
    console.error("Error getting repos:", error);
    throw error;
  }
}

async function getRepoFromName(name) {
  const query = `
    SELECT * FROM repos WHERE name=$1;
  `;

  try {
    const result = await db_pool.query(query, [name]);
    return result.rows[0];
  } catch (error) {
    console.error("Error getting repos:", error);
    throw error;
  }
}

async function getRepoFromID(id) {
  const query = `
    SELECT * FROM repos WHERE id=$1;
  `;

  try {
    const result = await db_pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error getting repos:", error);
    throw error;
  }
}

async function getRepoFromHash(hash) {
  const query = `
    SELECT * FROM repos WHERE hash=$1;
  `;

  try {
    const result = await db_pool.query(query, [hash]);
    return result.rows[0];
  } catch (error) {
    console.error("Error getting repos:", error);
    throw error;
  }
}

async function addRepoToTeam(repo_id, team_id) {
  const query = `
    INSERT INTO team_repos (repo_id, team_id)
    VALUES ($1, $2)
  `;

  try {
    const result = await db_pool.query(query, [repo_id, team_id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding repo to team:", error);
    throw error;
  }
}

async function modifyTools(repo_id, static_tool, llm_tool) {
  const query = `
    UPDATE repo_analysis
    SET static_tool = $2, llm_tool = $3
    WHERE repo_id = $1
  `;

  try {
    const result = await db_pool.query(query, [repo_id, static_tool, llm_tool]);
    return true;
  } catch (error) {
    console.error("Error modifying tools:", error);
    return false;
  }
}

async function addDefaultTools(repo_id) {
  const query = `
    INSERT INTO repo_analysis (repo_id, static_tool, llm_tool)
    VALUES ($1, $2, $3)
  `;

  try {
    const result = await db_pool.query(query, [repo_id, 'codeql', 'gemini' ]);
    return true;
  } catch (error) {
    console.error("Error adding tools:", error);
    return false;
  }
}

export {
  createUserRepo,
  getReposFromUserID,
  getRepoFromName,
  getRepoFromID,
  getRepoFromHash,
  deleteRepoQueryFromHash,
  addRepoToTeam,
  modifyTools,
  addDefaultTools
};
