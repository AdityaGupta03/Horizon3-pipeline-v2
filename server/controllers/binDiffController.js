import child_process from 'child_process';
const exec = child_process.exec;
async function runScript(req, res) {
  const { path1, path2 } = req.body;
  exec(`/Users/mkg/Documents/Horizon3-pipeline/pipeline/binDiff/run.sh "s3://bindifffiles/${path1}" "s3://bindifffiles/${path2}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Failed to run script',
      });
    }
    console.log('stdout', stdout);
    return res.status(200).json({
        message: 'Script ran successfully',
    });
  });
}
export { runScript };
