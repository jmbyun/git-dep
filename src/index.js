const fs = require('fs');
const path = require('path');
const git = require('./git');
const ssh = require('./git-ssh');

const DEFAULT_CONFIG_PATH = './git-dep.config.js';
const DEFAULT_BASE_PATH = 'git_repositories';

function getConfig() {
  if (fs.existsSync(DEFAULT_CONFIG_PATH)) {
    return require(path.join(process.cwd(), DEFAULT_CONFIG_PATH));
  } else {
    const package = require(path.join(process.cwd(), 'package.json'));
    if (package.gitDep) {
      return package.gitDep;
    } else {
      throw Error(`Failed to find the config for git-dep. Create "${DEFAULT_CONFIG_PATH}" maybe?`);
    }
  }
}

module.exports = function installGitRepos() {
  return new Promise((resolve, reject) => {
    const config = getConfig();
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
  });
};
