import {
  createAccountQuery,
  getAccountFromUsernameOrEmail,
  updateUsername,
} from "../database/queries/accountQueries.js";

/**
 * Creates a new user account with error checking for missing request params or exisiting username/email
 * @param {*} req
 * @param {*} res
 * @returns a response with a status and json body
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
    const existing_acc = await getAccountFromUsernameOrEmail(username, email);
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
 * Logs into exisiting user account
 * @param {*} req
 * @param {*} res
 */
async function loginToAccount(req, res) {
  console.error("Not implemented...");
  res.status(501).send("Not implemented");
}

/**
 * Changes an existing account to new username - verifies new username not already in use
 * @param {*} req
 * @param {*} res
 * @returns a response with a status code and json body
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
    // Check if username already exists
    const existing_acc = await getAccountFromUsernameOrEmail(new_username, "");
    if (existing_acc) {
      console.error("changeUsername(): username already exists");
      return res.status(409).json({
        error: "Username already exists",
      });
    }

    // Update account to new username
    const query_status = await updateUsername(user_id, new_username);
    if (query_status) {
      return res.status(200).json({
        message: "Updated username successfully",
      });
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
 *
 * @param {*} req
 * @param {*} res
 */
async function deleteAccount(req, res) {
  console.error("Not implemented...");
  res.status(501).send("Not implemented");
}

export {
  createAccount,
  verifyAccountEmail,
  loginToAccount,
  changeUsername,
  changePassword,
  deleteAccount,
};
