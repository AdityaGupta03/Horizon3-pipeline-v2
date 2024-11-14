import { Router } from "express";
import multer, { Multer } from "multer";

const upload: Multer = multer({ dest: "../uploads/" });

import {
  createAccount,
  verifyAccountEmail,
  loginToAccount,
  changeUsername,
  changePassword,
  deleteAccount,
  getReports,
  removeReport,
} from "../controllers/accountController.js";

import {
  uploadFile,
  createFolder,
  downloadFile,
  delete_file,
} from "../controllers/fileController.js";

import { runDocker } from "../controllers/binDiffController.js";

const userRouter: Router = Router();

// Define post routes and corresponding controller functions
userRouter.post("/create_account", createAccount);
userRouter.post("/verify_email", verifyAccountEmail);
userRouter.post("/login", loginToAccount);
userRouter.post("/change_username", changeUsername);
userRouter.post("/delete_account", deleteAccount);
userRouter.post("/change_password", changePassword);
userRouter.post("/change_password", changePassword);
userRouter.post("/get_reports", getReports);
userRouter.post("/remove_report", removeReport);

export default userRouter;
