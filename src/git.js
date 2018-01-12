const del = require('del');
const fs = require('fs');
const git = require('gulp-git');
const mkdirp = require('mkdirp');
const PathExists = require('path-exists');

function checkoutByParameters(path, target) {
  return new Promise((resolve, reject) => {
    git.checkout(target, {
      cwd: path,
      quiet: true
    }, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function getLatestTag(path, tagPattern) {
  return new Promise((resolve, reject) => {
    git.exec({
      args: `tag -l ${tagPattern} --sort=-v:refname`,
      cwd: path,
    }, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        if (stdout === '') {
          reject(`No tag found with ${tagPattern} from ${path}.`);
        } else {
          const tag = stdout.split('\n')[0];
          resolve(tag);
        }
      }
    });
  });
}

function checkoutByTagPattern(path, tagPattern) {
  return new Promise((resolve, reject) => {
    getLatestTag(path, tagPattern).then(tag => {
      checkoutByParameters(path, `tags/${tag}`).then(resolve, reject);
    }, reject);
  });
}

function checkout(project) {
  if (project.hash) {
    return checkoutByParameters(project.path, project.hash);
  } else if (project.tag) {
    return checkoutByTagPattern(project.path, project.tag);
  } else if (project.branch) {
    return checkoutByParameters(project.path, project.branch);
  } else {
    return checkoutByParameters(project.path, 'master');
  }
}

function setOrigin(project) {
  return new Promise((resolve, reject) => {
    git.exec({
      args: `remote set-url origin ${project.url}`,
      cwd: project.path,
      quiet: true
    }, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function clone(project, callback) {
  return new Promise((resolve, reject) => {
    git.clone(project.url, {
      args: project.path
    }, err => {
      if (err) {
        reject(err)
      } else {
        resolve();
      }
    });
  });
}

function fetch(project) {
  return new Promise((resolve, reject) => {
    git.fetch('', '', {
      args: '--all --tags --prune',
      cwd: project.path,
      quiet: true
    }, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function resetHard(project) {
  return new Promise((resolve, reject) => {
    git.reset('HEAD', {
      args: '--hard',
      cwd: project.path
    }, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function update(project, callback) {
  return new Promise((resolve, reject) => {
    fetch(project).then(() => {
      resetHard(project).then(() => {
        checkout(project).then(resolve, reject);
      }, reject);
    }, reject);
  });
}

function isRoot(path) {
  let dotlessPath = path;
  while (dotlessPath.startsWith('.')) {
    dotlessPath = dotlessPath.slice(1);
  }
  return new Promise((resolve, reject) => {
    git.exec({
      args: 'rev-parse --show-toplevel',
      cwd: path,
      quiet: true
    }, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        if (stdout.trim().endsWith(dotlessPath)) {
          resolve();
        } else {
          reject(`"${path}" is not a root directory of a Git repository.`);
        }
      }
    })
  });
}

function clearDirectories(basePath, projects) {
  const titles = projects.map(p => p.title);
  const unusedPathes = [];
  for (const path of fs.readdirSync(basePath)) {
    if (!titles.includes(path)) {
      unusedPathes.push(`${basePath}/${path}`);
    }
  }
  if (unusedPathes.length > 0) {
    del.sync(unusedPathes);
  }
}

function install(project) {
  return new Promise((resolve, reject) => {
    const isPath = PathExists.sync(project.path);
    if (isPath) {
      isRoot(project.path).then(() => {
        setOrigin(project).then(() => {
          update(project).then(resolve, reject);
        }, reject);
      }, reject);
    } else {
      clone(project).then(() => {
        update(project).then(resolve, reject);
      }, reject);
    }
  });
}

function getProjects(dependencies, basePath) {
  return Object.keys(dependencies).filter(title => !title.startsWith('_')).map(title => {
    const dependency = dependencies[title];
    const project = {
      title,
      url: dependency.repository,
      path: `${basePath}/${title}`
    };
    if (dependency.hash) {
      project.hash = dependency.hash;
    } else if (dependency.tag) {
      project.tag = dependency.tag;
    } else if (dependency.branch) {
      project.branch = dependency.branch;
    }
    return project;
  });
}

module.exports = function installAll(dependencies, basePath) {
  return new Promise((resolve, reject) => {
    let doneCount = 0;
    const projects = getProjects(dependencies, basePath);
    mkdirp.sync(basePath);
    clearDirectories(basePath, projects)

    for (const project of projects) {
      install(project).then(() => {
        doneCount += 1;
        if (doneCount === projects.length) {
          resolve();
        }
      }, reject);
    }
  });
}
