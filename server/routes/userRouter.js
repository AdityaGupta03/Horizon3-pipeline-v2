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

userRouter.post("/create_acc", createAccount);

export default userRouter;
