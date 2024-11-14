import { Router } from "express";
import multer from "multer";
const upload = multer({ dest: '../uploads/' })

import {
  createAccount,
  verifyAccountEmail,
  loginToAccount,
  changeUsername,
  changePassword,
  deleteAccount,
  getReports,
  removeReport
} from "../controllers/accountController.js";
import { uploadFile, createFolder, downloadFile, delete_file } from "../controllers/fileController.js";
import {runDocker} from "../controllers/binDiffController.js";
const userRouter = Router();

// Define post routes and corresponding controller functions
userRouter.post("/create_account", createAccount);
userRouter.post("/verify_email", verifyAccountEmail);
userRouter.post("/login", loginToAccount);
userRouter.post("/change_username", changeUsername);
userRouter.post("/delete_account", deleteAccount);
userRouter.post("/change_password", changePassword);
userRouter.post("/upload", upload.single('binary'), uploadFile);
userRouter.post("/create_folder", createFolder);
userRouter.post("/change_password", changePassword);
userRouter.post("/run_docker", runDocker);
userRouter.get("/download_file", downloadFile);
userRouter.post("/get_reports", getReports);
userRouter.post("/delete_file", delete_file);
userRouter.post("/remove_report", removeReport);

export default userRouter;
