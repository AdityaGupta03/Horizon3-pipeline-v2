import { Router } from "express";
import userRouter from "./userRouter.js";
import gitRouter from "./gitRouter.js";
import fileRouter from "./fileRouter.js";

const router: Router = Router();

router.use("/user", [userRouter, fileRouter]);
router.use("/git", gitRouter);

export default router;
