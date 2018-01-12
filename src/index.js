const git = require('./git');
const log = require('fancy-log')
const ssh = require('./git-ssh');

const DEFAULT_BASE_PATH = 'git_repositories';

function getConfig() {
  return new Promise((resolve, reject) => {
    const packageInfo = JSON.parse(fs.readFileSync(`./package.json`, 'utf8', err => {
      if (err) {
        reject(err);
      }
    }));
    if (packageInfo) {
      resolve(packageInfo.gitDep);
    } else {
      reject('Failed to parse package.json');
    }
  });
}

module.exports = function installGitRepos() {
  return new Promise((resolve, reject) => {
    getConfig().then(config => {
      const basePath = `${process.cwd()}/${config.basePath || DEFAULT_BASE_PATH}`;
      const dependencies = config.dependencies || {};
      if (config.sshKeyPath) {
        // When custom RSA private key is provided.
        const sshKeyPath = `${process.cwd()}/${config.sshKeyPath}`;
        ssh(sshKeyPath).then(() => {
          git(dependencies, basePath).then(resolve, reject);
        }, reject);
      } else {
        git(dependencies, basePath).then(resolve, reject);
      }
    }, reject);
  });
};
