import { db_pool } from "../db.js";

async function createAccountQuery(username, password, email) {
  const query = `
    INSERT INTO users (username, password, email)
    VALUES ($1, $2, $3)
    RETURNING user_id, username, email
  `;

  try {
    const result = await db_pool.query(query, [username, password, email]);
    return result.rows[0];
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
}

async function getAccountFromUsernameOrEmail(username, email) {
  const query = `
    SELECT * FROM users
    WHERE username = $1 OR email = $2
  `;

  try {
    const result = await db_pool.query(query, [username, email]);
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching account:", error);
    throw error;
  }
}

async function updateUsername(user_id, username) {
  const query = `
    UPDATE users
    SET username = $2
    WHERE user_id = $1
  `;

  try {
    const result = await db_pool.query(query, [user_id, username]);
    console.log(result);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating username:", error);
    throw error;
  }
}

export { createAccountQuery, getAccountFromUsernameOrEmail, updateUsername };
