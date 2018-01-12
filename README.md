
# git-dep

This module helps managing node.js package dependency towards Git repositories.

To use this module, include information that is required to
download and sync your Git repositories in your project's `package.json`.

Provide an object value with a key `"gitDep"`, which includes
base path to save your dependencies as `basePath`,
path to the file that stores RSA private key that is required to access
your repository as `sshKeyPath`,
and detailed information about the repositories as `dependencies`.

`dependencies` object should have one key for each dependent project.
For each dependent project, the object should contain
URL for the repository as `repository`, and optionally one of the three
following values.
Provide commit hash as `hash` or tag as `tag` if you want to download
a specific commit, or branch name as `branch` if you want to download the
latest version of a specific branch. Note that you can use the pattern for
version tags instead of specifying the exact tag to use. In this case,
the latest tag of all the matching ones are checked out and/or pulled.

Following example is a part of the `package.json` file for
download and updating `noVNC` and `elixer` as dependencies.

Please use Git>=2.3 to use `sshKeyPath` option. Otherwise a default SSH key
will be used when accessing repositories.

```json
{
  "name": "elice-web",
  "version": "18.1.2.0",
  "description": "elice-web",
  "author": "elice",
  ...
  "gitDep": {
    "sshKeyPath": "assets/id_rsa",
    "dependencies": {
      "noVNC": {
        "repository": "https://github.com/novnc/noVNC",
        "hash": "b56d9752"
      },
      "elixer": {
        "repository": "https://git.elicer.io/elice/elixer.git",
        "tag": "v0.1.*"
      }
    }
  }
}
```

To download and/or update your dependencies, run exported module as a function.

```javascript
const gitDep = require('git-dep');
gitDep();
```

This will return a promise instance, so you can directly return this in your
gulp task if you need to.

```javascript
gulp.task('git-install', ['pre-gitlab-install'], function() {
  return gitDep();
});
```
