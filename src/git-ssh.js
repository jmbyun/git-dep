const log = require('fancy-log');
const spawn = require('child_process').spawn;

function sshKeyChmod(path) {
  return new Promise((resolve, reject) => {
    try {
      const script = spawn('chmod', ['0600', path], { stdio: 'inherit' });
      script.on('exit', function (code) {
        if (code !== 0) {
          log.warn('Failed to change permission of SSH key file.');
        }
        resolve();
      });
    } catch (err) {
      log.warn('Failed to change permission of SSH key file.');
      resolve();
    }
  });
}

function setGitSshKeySync(path) {
  const commands = [
    'ssh',
    '-o',
    'StrictHostKeyChecking=no',
    '-i',
    path,
  ];
  process.env.GIT_SSH_COMMAND = commands.join(' ');
}

module.exports = function setupGitSsh(path) {
  return sshKeyChmod(path).then(val => {
    setGitSshKeySync(path);
    return val;
  });
};
