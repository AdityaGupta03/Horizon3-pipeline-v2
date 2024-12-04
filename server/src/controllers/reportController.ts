import {
  getAccountFromUserIDQuery,
  getReportsQuery,
  remove_report,
} from "../database/queries/accountQueries.js";

async function getReports(req: any, res: any) {
  const { user_id } = req.body;
  if (!user_id) {
    console.error("getReports(): Missing user information...");
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

    // Delete the specified user account (cascade deletes all associated data - check schema)
    const query_res = await getReportsQuery(user_id);
    if (!query_res) {
      console.error("getReports(): Error getting repos");
      throw Error;
    } else {
      console.log(query_res);
      const reportList = query_res.map((report) => ({
        id: report.report_id.toString(),
        name: report.report_url,
        vuln: report.high_prob_flag,
      }));
      return res.status(200).json({
        message: "Success adding repo!",
        reports: reportList,
      });
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({
      error: "Error deleting account",
    });
  }
}

async function removeReport(req: any, res: any) {
  console.log("wifejapoifejewa");
  console.log(req.body.url);
  const query = await remove_report(req.body.url);
  if (!query) {
    console.error("Error deleting report:");
    return res.status(500).json({
      error: "Error deleting report",
    });
  } else {
    return res.status(200).json({
      message: "Report deleted successfully",
    });
  }
}

export { getReports, removeReport };
