const fs = require('fs');
const git = require('./git');
const log = require('fancy-log')
const ssh = require('./git-ssh');

const DEFAULT_CONFIG_PATH = './git-dep.config.js';
const DEFAULT_BASE_PATH = 'git_repositories';

function getConfig() {
  if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
    return require(DEFAULT_CONFIG_PATH);
  } else {
    return require('./package.json').gitDep;
  }
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
