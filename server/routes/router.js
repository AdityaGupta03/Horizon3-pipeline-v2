import { Router } from "express";
import userRouter from "./userRouter.js";

const router = Router();

router.use("/user", userRouter);

export default router;
