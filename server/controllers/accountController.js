import { createAccountQuery } from "../database/queries/accountQueries.js";

async function createAccount(req, res) {
  const { username, password, email } = req.body;

  try {
    const newUser = await createAccountQuery(username, password, email);
    res.status(200).json({
      message: "Account created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).send("Error creating account");
  }
}

async function verifyAccountEmail(req, res) {
  console.error("Not implemented...");
  res.status(501).send("Not implemented");
}

async function loginToAccount(req, res) {
  console.error("Not implemented...");
  res.status(501).send("Not implemented");
}

async function changeUsername(req, res) {
  console.error("Not implemented...");
  res.status(501).send("Not implemented");
}

async function changePassword(req, res) {
  console.error("Not implemented...");
  res.status(501).send("Not implemented");
}

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
