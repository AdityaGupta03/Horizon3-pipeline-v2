import { Router } from "express";

import { getReports, removeReport } from "../controllers/reportController.js";

const reportRouter: Router = Router();

reportRouter.post("/get_reports", getReports);
reportRouter.post("/remove_report", removeReport);

export default reportRouter;
