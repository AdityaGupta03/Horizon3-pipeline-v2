import axios from "axios";
import {
  createUserRepo,
  getReposFromUserID,
  getRepoFromName,
} from "../database/queries/gitQueries.js";
import { getAccountFromUserIDQuery } from "../database/queries/accountQueries.js";

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
    const response = await axios.get(apiUrl, config);

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

    // Create repo with url, token, and user_id
    const query_res = await createUserRepo(
      user_id,
      url,
      private_flag,
      token,
      repo_name,
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
        id: repo.id,
        name: repo.name,
      }));
      return res.status(200).json({
        message: "Success adding repo!",
        repos: repoList,
      });
    }
  } catch (error) {
    console.error("Error changing username:", error);
    return res.status(500).json({
      error: "Error adding repo",
    });
  }
}

export { addGithubRepo, getGithubReposFromUser };
