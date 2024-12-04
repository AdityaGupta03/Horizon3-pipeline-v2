import { Router } from "express";
import userRouter from "./userRouter.js";
import gitRouter from "./gitRouter.js";
import fileRouter from "./fileRouter.js";
import teamRouter from "./teamRouter.js";
import reportRouter from "./reportRouter.js";

const router: Router = Router();

router.use("/user", [userRouter, fileRouter, reportRouter]);
router.use("/git", gitRouter);
router.use("/team", teamRouter);

export default router;
