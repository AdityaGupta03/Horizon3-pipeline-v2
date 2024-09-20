import {
  createAccountQuery,
  deleteAccountQuery,
  loginToAccountQuery,
  getAccountFromUsernameOrEmailQuery,
  updateUsernameQuery,
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

    // Create the new user account
    const newUser = await createAccountQuery(username, password, email);
    if (newUser) {
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

    // Check if login credentials match an account
    const user_acc = await loginToAccountQuery(username, password);
    if (!user_acc) {
      console.error("loginToAccount(): Invalid credentials");
      return res.status(401).json({
        error: "Invalid username or password",
      });
    }

    // Check if the account is verified
    if (user_acc.verified == 0) {
      console.error("loginToAccount(): Account not verified");
      return res.status(403).json({
        error: "Account not verified",
        message: "Please verify your email address to log in",
      });
    } else {
      console.log("loginToAccount(): Login successful");
      return res.status(200).json({
        message: "Login successful",
        user_id: user_acc.user_id,
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
 *
 * @param {*} req
 * @param {*} res
 */
async function changePassword(req, res) {
  console.error("Not implemented...");
  res.status(501).send("Not implemented");
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
