import { db_pool } from "../db.js";

async function createUserRepo(user_id, url, priv_flag, token, name) {
  const query = `
    INSERT INTO repos (github_url, token, creator_id, private, name)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;

  try {
    const result = await db_pool.query(query, [
      url,
      token,
      user_id,
      priv_flag,
      name,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating repo:", error);
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

export { createUserRepo, getReposFromUserID, getRepoFromName };
