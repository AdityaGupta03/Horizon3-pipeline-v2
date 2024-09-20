import { Router } from "express";

import {
  createAccount,
  verifyAccountEmail,
  loginToAccount,
  changeUsername,
  changePassword,
  deleteAccount,
} from "../controllers/accountController.js";

const userRouter = Router();

// Define post routes and corresponding controller functions
userRouter.post("/create_account", createAccount);
userRouter.post("/login", loginToAccount);
userRouter.post("/change_username", changeUsername);
userRouter.post("/delete_account", deleteAccount);

export default userRouter;
