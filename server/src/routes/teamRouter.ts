import { Router } from "express";
import {
  createTeam,
  addMember,
  getTeamsFromUserID,
  requestToJoinTeam,
  approveTeamRequest,
  removeTeamMember,
  leaveTeam,
} from "../controllers/teamController.js";

const teamRouter: Router = Router();

teamRouter.post("/create_team", createTeam);
teamRouter.post("/add_member", addMember);
teamRouter.post("/get_user_teams", getTeamsFromUserID);
teamRouter.post("/request_join_team", requestToJoinTeam);
teamRouter.post("/approve_team_request", approveTeamRequest);
teamRouter.post("/kick_member", removeTeamMember);
teamRouter.post("/leave_team", leaveTeam);

export default teamRouter;
