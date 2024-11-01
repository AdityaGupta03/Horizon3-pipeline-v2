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

async function deleteAccountQuery(user_id) {
  // Delete user and cascade to related tables
  const query = `
    DELETE FROM users
    WHERE user_id = $1
  `;

  try {
    const result = await db_pool.query(query, [user_id]);
    return result;
  } catch (error) {
    console.error("deleteAccountQuery()", error);
    throw error;
  }
}

async function getAccountFromUsernameOrEmailQuery(username, email) {
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

async function getAccountFromUserIDQuery(user_id) {
  const query = `
    SELECT * FROM users
    WHERE user_id = $1
  `;

  try {
    const result = await db_pool.query(query, [user_id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching account: ", error);
    throw error;
  }
}

async function updateUsernameQuery(user_id, username) {
  const query = `
    UPDATE users
    SET username = $2
    WHERE user_id = $1
  `;

  try {
    const result = await db_pool.query(query, [user_id, username]);
    return result;
  } catch (error) {
    console.error("Error updating username:", error);
    throw error;
  }
}

async function updatePasswordQuery(user_id, hash_password) {
  const query = `
    UPDATE users
    SET password = $2
    WHERE user_id = $1
  `;

  try {
    const result = await db_pool.query(query, [user_id, hash_password]);
    return result;
  } catch (error) {
    console.error("Error updating username:", error);
    throw error;
  }
}

async function verifyUserAccountQuery(user_id) {
  const query = `
    UPDATE users
    SET verified = 1
    WHERE user_id = $1
  `;

  try {
    const result = await db_pool.query(query, [user_id]);
    return result;
  } catch (error) {
    console.error("Error verifying account:", error);
    throw error;
  }
}

async function getReportsQuery(user_id) {
  const query = `
    SELECT report_id, report_url FROM reports
    WHERE creator_id = $1
  `;

  try {
    const result = await db_pool.query(query, [user_id]);
    return result.rows;
  }
  catch(error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
}
async function remove_report(report_id) {
  const query = `
    DELETE FROM reports
    WHERE report_url = $1
  `;

  try {
    const result = await db_pool.query(query, [report_id]);
    return result;
  }
  catch(error) {
    console.error("Error deleting report:", error);
    throw error;
  }
}

export {
  createAccountQuery,
  deleteAccountQuery,
  getAccountFromUsernameOrEmailQuery,
  getAccountFromUserIDQuery,
  updateUsernameQuery,
  updatePasswordQuery,
  verifyUserAccountQuery,
  getReportsQuery,
  remove_report
};
