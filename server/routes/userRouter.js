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
} from "../controllers/accountController.js";
import { uploadFile, createFolder } from "../controllers/fileController.js";

const userRouter = Router();

// Define post routes and corresponding controller functions
userRouter.post("/create_account", createAccount);
userRouter.post("/login", loginToAccount);
userRouter.post("/change_username", changeUsername);
userRouter.post("/delete_account", deleteAccount);
<<<<<<< Updated upstream
=======
userRouter.post("/change_password", changePassword);
userRouter.post("/upload", upload.single('binary'), uploadFile);
userRouter.post("/create_folder", createFolder);
>>>>>>> Stashed changes

export default userRouter;
