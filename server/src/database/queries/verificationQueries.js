import { db_pool } from "../db.js";

async function insertVerificationCodeQuery(user_id, code) {
  const query = `
    INSERT INTO user_verification (user_id, code)
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

async function getVerificationCodeQuery(user_id) {
  const query = `
    SELECT * FROM user_verification
    WHERE user_id = $1
  `;

  try {
    const result = await db_pool.query(query, [user_id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching verification code:", error);
    throw error;
  }
}

async function deleteVerificationCodeQuery(user_id) {
  const query = `
    DELETE FROM user_verification
    WHERE user_id = $1
  `;

  try {
    const result = await db_pool.query(query, [user_id]);
    return result;
  } catch (error) {
    console.error("Error deleting verification code:", error);
    throw error;
  }
}

export {
  insertVerificationCodeQuery,
  getVerificationCodeQuery,
  deleteVerificationCodeQuery,
};
