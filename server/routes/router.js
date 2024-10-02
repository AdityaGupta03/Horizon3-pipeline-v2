import { Router } from "express";
import userRouter from "./userRouter.js";
import gitRouter from "./gitRouter.js";

const router = Router();

router.use("/user", userRouter);
router.use("/git", gitRouter);

export default router;
