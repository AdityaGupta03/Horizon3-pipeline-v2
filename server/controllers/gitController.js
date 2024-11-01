import axios from "axios";
import { execFile } from "child_process";

import { getAccountFromUserIDQuery } from "../database/queries/accountQueries.js";
import {
  createUserRepo,
  getReposFromUserID,
  getRepoFromName,
  getRepoFromID,
  getRepoFromHash,
} from "../database/queries/gitQueries.js";

import { sendKafkaEvent } from "../helpers/kafkaFuncs.js";
import { encryptPassword } from "../helpers/encryptionFuncs.js";

async function addGithubRepo(req, res) {
  const { user_id, url, token, owner, repo_name } = req.body;

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
      return res.status(200).json({
        message: "Success adding repo!",
      });
    }
  } catch (error) {
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

async function getGithubReposFromUser(req, res) {
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

async function analyzeGithubRepo(req, res) {
  const { repo_id } = req.body;

  if (!repo_id) {
    console.error("analyzeGithubRepo): Missing user information...");
    return res.status(400).json({
      error: "Missing required information.",
    });
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

    const metadata = {
      url: repo.github_url,
      repo_name: repo.name,
      repo_owner: repo.owner,
      repo_token: repo.token,
      repo_hash: repo_id,
    };

    await sendKafkaEvent("github_analysis", metadata);

    return res.status(200).json({
      message: "Successfully started pipeline!",
      output: "Queued event!",
    });
  } catch (error) {
    console.error("Error analyzing repo:", error);
    return res.status(500).json({
      error: "Error analyzing repo",
    });
  }
}

export { addGithubRepo, getGithubReposFromUser, analyzeGithubRepo };
