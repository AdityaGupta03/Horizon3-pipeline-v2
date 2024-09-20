import { encryptPassword, comparePassword } from "../helpers/ecryptionFuncs.js";

import { insertVerificationCodeQuery } from "../database/queries/verificationQueries.js";
import {
  createAccountQuery,
  deleteAccountQuery,
  getAccountFromUsernameOrEmailQuery,
  updateUsernameQuery,
  updatePasswordQuery,
  getAccountFromUserIDQuery,
} from "../database/queries/accountQueries.js";

/**
 * Creates a new user account
 * @param {Object} req - The request object containing username, password, and email
 * @param {Object} res - The response object to send back to the client
 * @returns {Object} A response with a status code and JSON body
 */
async function createAccount(req, res) {
  const { username, password, email } = req.body;

  // Check if request json is missing necessary parameters
  if (!username || !password || !email) {
    console.error("createAccount(): Missing user information...");
    return res.status(400).json({
      error: "Missing required information.",
    });
  }

  try {
    // Check if account already exists with the given username or password
    const existing_acc = await getAccountFromUsernameOrEmailQuery(
      username,
      email,
    );
    if (existing_acc) {
      let errMsg = "";
      if (existing_acc.email == email) {
        errMsg = "Email already in use!";
      } else if (existing_acc.username == username) {
        errMsg = "Username already in use!";
      } else {
        errMsg = "Account already exists!";
      }
      console.log(errMsg);
      return res.status(409).json({
        error: errMsg,
      });
    }

    // Encrypt the password
    const hash = await encryptPassword(password);

    const newUser = await createAccountQuery(username, hash, email);
    if (newUser) {
      // Create a user verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      console.log(`Verification code for ${username}: ${verificationCode}`);

      const verificationResult = await insertVerificationCodeQuery(
        newUser.user_id,
        verificationCode,
      );
      if (!verificationResult) {
        throw new Error("Error creating verification code");
      }

      // Send verification code to user's email
      const email_subject = "Verify your H3 Pipeline account!";
      const email_body = `Your verification code is: ${verificationCode}`;

      return res.status(200).json({
        message: "Account created successfully",
        user: newUser,
      });
    } else {
      throw error;
    }
  } catch (error) {
    console.error("Error creating account:", error);
    return res.status(500).json({
      error: "Error creating account",
    });
  }
}

/**
 * Verifies email account
 * @param {*} req
 * @param {*} res
 */
async function verifyAccountEmail(req, res) {
  console.error("Not implemented...");
  res.status(501).send("Not implemented");
}

/**
 * Handles user login by verifying credentials and account status
 * @param {Object} req - The request object containing username and password
 * @param {Object} res - The response object to send back to the client
 * @returns {Object} A response with a status code and JSON body
 */
async function loginToAccount(req, res) {
  const { username, password } = req.body;

  // Check if request json is missing necessary parameters
  if (!username || !password) {
    console.error("loginToAccount(): Missing user information...");
    return res.status(400).json({
      error: "Missing required information.",
    });
  }

  try {
    // Check if username exists
    const acc_exists = await getAccountFromUsernameOrEmailQuery(username, "");
    if (!acc_exists) {
      console.error("loginToAccount(): Account does not exist");
      return res.status(404).json({
        error: "Account not found",
      });
    }

    // Check if the account is verified
    if (!(await comparePassword(password, acc_exists.password))) {
      console.error("loginToAccount(): Invalid password");
      return res.status(401).json({
        error: "Invalid password",
      });
    }

    if (acc_exists.verified == 0) {
      console.error("loginToAccount(): Account not verified");
      return res.status(403).json({
        error: "Account not verified",
        message: "Please verify your email address to log in",
      });
    } else {
      console.log("loginToAccount(): Login successful");
      return res.status(200).json({
        message: "Login successful",
        user_id: acc_exists.user_id,
      });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({
      error: "Error logging in",
    });
  }
}

/**
 * Changes the username for an existing user account
 * @param {Object} req - The request object containing user_id and new_username
 * @param {Object} res - The response object to send back to the client
 * @returns {Object} A response with a status code and JSON body
 */
async function changeUsername(req, res) {
  const { user_id, new_username } = req.body;

  // Check if request json is missing necessary parameters
  if (!user_id || !new_username) {
    console.error("createAccount(): Missing user information...");
    return res.status(400).json({
      error: "Missing required information.",
    });
  }

  try {
    // Check if user specified exists
    const user_acc = await getAccountFromUserIDQuery(user_id);
    if (!user_acc) {
      console.error("User account doesn't exist: ", user_id);
      return res.status(404).json({
        error: "User account not found",
      });
    }

    // Check if username already exists
    const existing_acc = await getAccountFromUsernameOrEmailQuery(
      new_username,
      "",
    );
    if (existing_acc) {
      console.error("changeUsername(): username already exists");
      return res.status(409).json({
        error: "Username already exists",
      });
    }

    // Update account to new username
    const query_status = await updateUsernameQuery(user_id, new_username);
    if (query_status) {
      return res.status(200).json({
        message: "Updated username successfully",
      });
    } else {
      throw Error;
    }
  } catch (error) {
    console.error("Error changing username:", error);
    return res.status(500).json({
      error: "Error changing username",
    });
  }
}

/**
 * Changes the password for an existing user account
 * @param {Object} req - The request object containing user_id, old_password, and new_password
 * @param {Object} res - The response object to send back to the client
 * @returns {Object} A response with a status code and JSON body
 */
async function changePassword(req, res) {
  const { user_id, old_password, new_password } = req.body;

  // Check if request json is missing necessary parameters
  if (!user_id || !old_password || !new_password) {
    console.error("createAccount(): Missing user information...");
    return res.status(400).json({
      error: "Missing required information.",
    });
  }

  try {
    // Check if user specified exists
    const user_acc = await getAccountFromUserIDQuery(user_id);
    if (!user_acc) {
      console.error("User account doesn't exist: ", user_id);
      return res.status(404).json({
        error: "User account not found",
      });
    }

    // Validate old password
    if (!(await comparePassword(old_password, user_acc.password))) {
      console.error("loginToAccount(): Invalid password");
      return res.status(200).json({
        error: "Old password does not match",
      });
    }

    // Hash new password
    const hash = await encryptPassword(new_password);

    // Update account to new username
    const query_status = await updatePasswordQuery(user_id, hash);
    if (query_status) {
      return res.status(200).json({
        message: "Updated password successfully",
      });
    } else {
      throw Error;
    }
  } catch (error) {
    console.error("changePassword():", error);
    return res.status(500).json({
      error: "Error changing password",
    });
  }
}

/**
 * Deletes a user account and associated data
 * @param {Object} req - The request object containing user_id
 * @param {Object} res - The response object to send back to the client
 * @returns {Object} A response with a status code and JSON body
 */
async function deleteAccount(req, res) {
  const { user_id } = req.body;

  // Check if request json is missing necessary parameters
  if (!user_id) {
    console.error("deleteAccount(): Missing user information...");
    return res.status(400).json({
      error: "Missing required information.",
    });
  }

  try {
    // Check if user specified exists
    const user_acc = await getAccountFromUserIDQuery(user_id);
    if (!user_acc) {
      console.error("User account doesn't exist: ", user_id);
      return res.status(404).json({
        error: "User account not found",
      });
    }

    // Delete the specified user account (cascade deletes all associated data - check schema)
    const query_status = await deleteAccountQuery(user_id);
    if (query_status) {
      return res.status(200).json({
        message: "Deleted account successfully",
      });
    } else {
      throw Error;
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({
      error: "Error deleting account",
    });
  }
}

export {
  createAccount,
  verifyAccountEmail,
  loginToAccount,
  changeUsername,
  changePassword,
  deleteAccount,
};
