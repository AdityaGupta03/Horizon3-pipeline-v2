import { Router } from "express";

import {
  addGithubRepo,
  getGithubReposFromUser,
  analyzeGithubRepo,
  removeGitRepo,
  addTeamToRepo,
} from "../controllers/gitController.js";

const gitRouter: Router = Router();

// Define post routes and corresponding controller functions
gitRouter.post("/create_git_repo", addGithubRepo);
gitRouter.post("/get_repos_from_user", getGithubReposFromUser);
gitRouter.post("/analyze_repo", analyzeGithubRepo);
gitRouter.post("/delete_repo", removeGitRepo);
gitRouter.post("/add_team_to_repo", addTeamToRepo);

export default gitRouter;
