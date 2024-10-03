import { Router } from "express";

import {
  addGithubRepo,
  getGithubReposFromUser,
  analyzeGithubRepo,
} from "../controllers/gitController.js";

const gitRouter = Router();

// Define post routes and corresponding controller functions
gitRouter.post("/create_git_repo", addGithubRepo);
gitRouter.post("/get_repos_from_user", getGithubReposFromUser);
gitRouter.post("/analyze_repo", analyzeGithubRepo);

export default gitRouter;
