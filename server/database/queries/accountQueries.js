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

export { createAccountQuery };
