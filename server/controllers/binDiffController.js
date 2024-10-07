import child_process from 'child_process';
import Docker from 'dockerode';
const exec = child_process.exec;

async function runDocker(req, res) {
  const docker = new Docker();
  var auth = {
    username: 'mkg880',
    password: 'h3.pipeline.poc.team1.407',
    auth: '',
    email: 'gandhimehrzad@gmail.com',
    serveraddress: 'https://index.docker.io/v1'
  };
  docker.pull('mkg880/bindiff', {authconfig: auth}, function(err, stream) {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Failed to pull docker image',
      });
    }
    docker.run('mkg880/bindiff', ['root/run.sh', `s3://bindifffiles/${req.body.folder}`, `${req.body.path1}`, `${req.body.path2}`], process.stdout, function(err, data) {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: 'Failed to run docker image',
        });
      }
      console.log(data);
      return res.status(200).json({
        message: 'Docker ran successfully',
      });
    });
  });
}
export { runDocker };
