import { db_pool } from "../db.js";

async function insertVerificationCodeQuery(user_id, code) {
  const query = `
    INSERT INTO verification_codes (user_id, code)
    VALUES ($1, $2)
    RETURNING user_id, code
  `;

  try {
    const result = await db_pool.query(query, [user_id, code]);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting verification code:", error);
    throw error;
  }
}

export { insertVerificationCodeQuery };
