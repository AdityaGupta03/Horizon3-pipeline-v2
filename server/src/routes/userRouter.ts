import { Router } from "express";

import * as accController from "../controllers/accountController.js";

const userRouter: Router = Router();

// Define post routes and corresponding controller functions
userRouter.post("/create_account", accController.createAccount);
userRouter.post("/verify_email", accController.verifyAccountEmail);
userRouter.post("/login", accController.loginToAccount);
userRouter.post("/change_username", accController.changeUsername);
userRouter.post("/delete_account", accController.deleteAccount);
userRouter.post("/change_password", accController.changePassword);
userRouter.post("/get_all_users", accController.getAllUsers);

export default userRouter;
