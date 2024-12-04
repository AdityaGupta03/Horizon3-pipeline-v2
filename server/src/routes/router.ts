import { Router } from "express";
import userRouter from "./userRouter.js";
import gitRouter from "./gitRouter.js";
import fileRouter from "./fileRouter.js";
import teamRouter from "./teamRouter.js";

const router: Router = Router();

router.use("/user", [userRouter, fileRouter]);
router.use("/git", gitRouter);
router.use("/team", teamRouter);

export default router;
