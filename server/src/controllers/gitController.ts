import axios from "axios";

import { getAccountFromUserIDQuery } from "../database/queries/accountQueries.js";
import {
  createUserRepo,
  getReposFromUserID,
  getRepoFromName,
  getRepoFromHash,
  deleteRepoQueryFromHash,
  addRepoToTeam,
  modifyTools,
  addDefaultTools,
} from "../database/queries/gitQueries.js";

import { sendKafkaEvent } from "../utils/kafkaFuncs.js";
import { encryptPassword } from "../utils/encryptionFuncs.js";
import { emailUser } from "../utils/emailFuncs.js";
import { GitAnalysisMeta } from "../types/kafkameta.type.js";

async function addGithubRepo(req: any, res: any) {
  const { user_id, url, token, owner, repo_name } = req.body;
  //@TODO have got the fields for type of static analyssi have to update

  // Check if request json is missing necessary parameters
  if (!user_id || !url || !owner || !repo_name) {
    console.error("addGithubRepo(): Missing user information...");
    console.error(req.body);
    return res.status(400).json({
      error: "Missing required information.",
    });
  }

  let response;
  try {
    // Check if user specified exists
    const user_acc = await getAccountFromUserIDQuery(user_id);
    if (!user_acc) {
      console.error("User account doesn't exist: ", user_id);
      return res.status(404).json({
        error: "User account not found",
      });
    }

    const repo_exists = await getRepoFromName(repo_name);
    if (repo_exists) {
      console.error("Repo already exist: ", user_id);
      return res.status(404).json({
        error: "Repo already exists",
      });
    }

    let config = {};
    if (token) {
      config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo_name}`;
    response = await axios.get(apiUrl, config);

    if (response.status === 404) {
      console.log("Repo doesn't exist or is private without proper token");
      return res.status(412).json({
        error: "Repo doesn't exist or is private and token doesn't work/exists",
      });
    }

    let private_flag = 0;
    if (response.data.private) {
      console.log("The repository is private.");
      private_flag = 1;
    }

    // Generate unique hash for repo (id we can give the user)
    const repoHash = await encryptPassword(`${user_id}-${repo_name}-${owner}`);

    // Create repo with url, token, and user_id
    const query_res = await createUserRepo(
      user_id,
      url,
      private_flag,
      token,
      repo_name,
      owner,
      repoHash,
    );

    if (!query_res) {
      console.error("addGithubRepo(): Error creating repo");
      throw Error;
    } else {
      const tools_res = await addDefaultTools(query_res.id);
      console.log(tools_res);
      if (!tools_res) {
        console.error("addGithubRepo(): Error adding tools");
        throw Error;
      }
      return res.status(200).json({
        message: "Success adding repo!",
      });
    }
  } catch (error: any) {
    console.error("Error changing username:", error);
    console.error(response);
    if (error.status === 404) {
      console.log("Repo doesn't exist or is private without proper token");
      return res.status(412).json({
        error: "Repo doesn't exist or is private and token doesn't work/exists",
      });
    }
    return res.status(500).json({
      error: "Error adding repo",
    });
  }
}

async function removeGitRepo(req: any, res: any) {
  const { user_id, repo_hash } = req.body;

  // Check for missing request params
  if (!user_id || !repo_hash) {
    console.error("removeGitRepo(): Missing request params");
    return res.status(400).json({
      error: "Missing required information.",
    });
  }

  try {
    // TODO add logic for deleting a repository (assume exists?)
    const deletedRepo = await deleteRepoQueryFromHash(user_id, repo_hash);

    let msg: string;
    let errCode: Number;
    if (deletedRepo) {
      msg = "Successfully deleted the repository!";
      errCode = 200;
    } else {
      msg = "Failed to delete repository - does not exist.";
      errCode = 404;
    }

    return res.status(errCode).json({
      message: msg,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error remove repository.",
    });
  }
}

async function getGithubReposFromUser(req: any, res: any) {
  const { user_id } = req.body;

  // Check if request json is missing necessary parameters
  if (!user_id) {
    console.error("getGithubRepos(): Missing user information...");
    console.error(req.body);
    return res.status(400).json({
      error: "Missing required information.",
    });
  }

  try {
    // Check if user specified exists
    const user_acc = await getAccountFromUserIDQuery(user_id);
    if (!user_acc) {
      console.error("User account doesn't exist: ", user_id);
      return res.status(404).json({
        error: "User account not found",
      });
    }

    // Create repo with url, token, and user_id
    const query_res = await getReposFromUserID(user_id);
    if (!query_res) {
      console.error("addGithubRepo(): Error getting repos");
      throw Error;
    } else {
      console.log(query_res);
      const repoList = query_res.map((repo) => ({
        id: repo.hash,
        name: repo.name,
      }));
      return res.status(200).json({
        message: "Success adding repo!",
        repos: repoList,
      });
    }
  } catch (error) {
    console.error("Error getting repos:", error);
    return res.status(500).json({
      error: "Error getting repo",
    });
  }
}

async function analyzeGithubRepo(req: any, res: any) {
  let { repo_id, analysis_type, llm_type } = req.body;

  if (!repo_id) {
    console.error("analyzeGithubRepo): Missing user information...");
    return res.status(400).json({
      error: "Missing required information.",
    });
  }

  if (!analysis_type) {
    analysis_type = "codeql";
  }

  if (!llm_type) {
    llm_type = "gemini";
  }

  try {
    // Check if user specified exists
    const repo = await getRepoFromHash(repo_id);
    if (!repo) {
      console.error("Repo: ", repo_id);
      return res.status(404).json({
        error: "Repo not found",
      });
    }

    console.log(repo);

    const user_id = repo.creator_id;
    const user_acc = await getAccountFromUserIDQuery(user_id);
    if (!user_acc) {
      console.error("User account doesn't exist: ", user_id);
      return res.status(404).json({
        error: "User account not found",
      });
    }

    const query_result = await modifyTools(repo.id, analysis_type, llm_type);
    if (!query_result) {
      throw Error("modifyTools() failed");
    }

    const email_subject = `Started analysis pipeline on ${repo.name}`;
    const email_body = `We have started running the analysis pipeline on your ${repo.name} repository. If you think this is a mistake, please contact us.\n\n We will notify you when your report is ready.`;
    const email_status: boolean = await emailUser(
      user_acc.email,
      email_subject,
      email_body,
    );

    if (!email_status) {
      throw new Error("Error sending verification email");
    }

    const metadata: GitAnalysisMeta = {
      url: repo.github_url,
      repo_name: repo.name,
      repo_owner: repo.owner,
      repo_token: repo.token,
      repo_hash: repo_id,
    };

    let status: boolean = await sendKafkaEvent("github_analysis", metadata);
    if (!status) {
      throw new Error("Failed to run pipeline");
    }

    return res.status(200).json({
      message: "Successfully started pipeline!",
      output: "Queued event!",
    });
  } catch (error: any) {
    console.error("Error analyzing repo:", error);
    return res.status(500).json({
      error: "Error analyzing repo",
    });
  }
}

async function addTeamToRepo(req: any, res: any) {
  let { team_id, repo_hash } = req.body;
  if (!team_id || !repo_hash) {
    console.error("Missing request fields.");
    return res.status(400).json({
      error: "Missing request fields.",
    });
  }

  try {
    const repo = await getRepoFromHash(repo_hash);
    if (!repo) {
      console.error("Repo doesn't exist: ", repo_hash);
      return res.status(404).json({
        error: "Repo not found",
      });
    }

    const query_result = await addRepoToTeam(repo.id, team_id);
    if (!query_result) {
      throw Error("addTeamToRepo() failed");
    }

    return res.status(200).json({
      message: "Successfully added team to repo.",
    });
  } catch (error) {
    console.log("Failed: ", error);
    return res.status(500).json({
      error: "Error adding team to repo.",
    });
  }
}

export {
  addGithubRepo,
  getGithubReposFromUser,
  analyzeGithubRepo,
  removeGitRepo,
  addTeamToRepo,
};
