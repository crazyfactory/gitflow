const Configstore = require('configstore');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const github = require('./github');
const inquirer = require('./inquirer');
const {toDashCase, toIssueNumberAndName} = require('./util');
const conf = new Configstore('gitflow');

const CHANGES_CONFLICT_ERROR = 'Your local changes to the following files would be overwritten by checkout';
const DEFAULT_REMOTE = 'origin';

async function checkout(branch) {
  await exec(`git checkout ${branch}`);
}

async function createAndCheckoutBranch(branch) {
  await exec(`git checkout -b ${branch}`);
}

async function fetchAll() {
  await exec('git fetch --all');
}

async function finishSprint(config) {
  const {projectName, sprintNumber} = await inquirer.askProjectNameAndSprintNumber(config);
  const {confirm} = await inquirer.confirmFinishing(
    `Are you sure, you finished sprint ${sprintNumber} of ${projectName}`
  );
  if (!confirm) {
    throw new Error('Operation aborted');
  }
  const branch = `${projectName}/sprint-${sprintNumber}`;
  await fetchAll();
  try {
    await checkout(branch);
    await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${branch}`)
  } catch (e) {

  }
}

async function finishFeature(config) {
  const branch = await getCurrentBranch();
  if (!branch) {
    throw new Error('You are not in any branch (detached HEAD?)');
  }
  const {projectName, sprintNumber} = await inquirer.askProjectNameAndSprintNumber(config);
  const baseBranch = `${projectName}/sprint-${sprintNumber}`;
  const {confirm} = await inquirer.confirmFinishing(`Are you sure, you finished ${branch} of ${baseBranch}`);
  if (!confirm) {
    throw new Error('Operation aborted');
  }
  const {owner, repo} = await getOwnerAndRepo();
  const {issueNumber} = toIssueNumberAndName(branch);
  await github.initiateOctokit();
  const response = await github.createPull(
    {owner, repo, title: branch, head: branch, base: baseBranch, body: `Closes #${issueNumber}`}
  );
  console.log(`pull request created successfully at ${response.data.html_url}`);

  await fetchAll();
  try {
    await goToBaseBranch();
  } catch (e) {
    if (e.message.indexOf(CHANGES_CONFLICT_ERROR) === -1) {
      throw e;
    }
    const {confirm} = await inquirer.confirmStash();
    if (!confirm) {
      throw new Error('Operation aborted');
    }
    await stash();
    await goToBaseBranch();
  }

  async function goToBaseBranch() {
    await checkout(baseBranch);
    await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${baseBranch}`);
  }
}

async function getCurrentBranch() {
  const {stdout} = await exec('git rev-parse --abbrev-ref HEAD');
  return stdout.trim();
}

function getConfig(key) {
  const projectName = conf.get(`${key}projectName`);
  const sprintNumber = conf.get(`${key}sprintNumber`);
  return {projectName, sprintNumber};
}

// works for github, gitlab, and bitbucket patterns
async function getOwnerAndRepo() {
  const {stdout} = await exec(`git config --get remote.${DEFAULT_REMOTE}.url`);
  const arr = stdout.split('/');

  /**
   * e.g.
   * https://bitbucket.org/[owner]/[repo].git
   * https://gitlab.com/[owner]/[repo].git
   * https://github.com/[owner]/[repo].git
   */
  if (stdout.indexOf('https') !== -1) {
    return {
      owner: arr[arr.length - 2],
      repo: arr[arr.length - 1].substring(0, arr[arr.length - 1].indexOf('.git'))
    }
  }
  /**
   * e.g.
   * git@bitbucket.org:[owner]/[repo].git
   * git@gitlab.com:[owner]/[repo].git
   * git@github.com:[owner]/[repo].git
   */
  else {
    return {
      owner: arr[0].substring(arr[0].indexOf(':') + 1),
      repo: arr[1].substring(0, arr[1].indexOf('.git'))
    }
  }
}

async function isGitDirectory() {
  try {
    const {stdout} = await exec('git rev-parse --is-inside-work-tree', {encoding: 'utf8'});
    return stdout
  } catch (e) {
    return false;
  }
}

async function push(branch) {
  await exec(`git push -u ${DEFAULT_REMOTE} ${branch}`);
}

async function resetHardToRemoteBranch(remoteBranch) {
  await exec(`git reset --hard ${remoteBranch}`);
}

function setConfig(key, {projectName, sprintNumber}) {
  conf.set(`${key}projectName`, projectName);
  conf.set(`${key}sprintNumber`, sprintNumber);
}

async function startFeature(config) {
  const {projectName, sprintNumber} = await inquirer.askProjectNameAndSprintNumber(config);
  const {issueNumber, feature} = await inquirer.askIssueNumberAndFeature();
  const refinedFeature = toDashCase(feature);
  await fetchAll();
  try {
    await doStartFeature();
  } catch (e) {
    if (e.message.indexOf(CHANGES_CONFLICT_ERROR) === -1) {
      throw e;
    }
    const {confirm} = await inquirer.confirmStash();
    if (!confirm) {
      throw new Error('Operation aborted');
    }
    await stash();
    await doStartFeature();
  }

  async function doStartFeature() {
    const baseBranch = `${projectName}/sprint-${sprintNumber}`;
    const targetBranch = `${issueNumber}-${refinedFeature}`;
    await checkout(baseBranch);
    await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${baseBranch}`);
    await createAndCheckoutBranch(targetBranch);
    await push(targetBranch);
    console.log('feature branch created successfully');
  }
}

async function startHotfix() {
  const {hotfix, issueNumber} = await inquirer.askIssueNumberAndHotfix();
  const refinedHotfix = toDashCase(hotfix);
  await fetchAll();
  try {
    await doStartHotfix();
  } catch (e) {
    if (e.message.indexOf(CHANGES_CONFLICT_ERROR) === -1) {
      throw e;
    }
    const {confirm} = await inquirer.confirmStash();
    if (!confirm) {
      throw new Error('Operation aborted');
    }
    await stash();
    await doStartHotfix();
  }

  async function doStartHotfix() {
    const baseBranch = 'master';
    const targetBranch = `hotfix/${issueNumber}-${refinedHotfix}`;
    await checkout(baseBranch);
    await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${baseBranch}`);
    await createAndCheckoutBranch(targetBranch);
    await push(targetBranch);
    console.log('hotfix branch created successfully');
  }
}

async function startSprint(config) {
  const {projectName, sprintNumber} = await inquirer.askProjectNameAndSprintNumber(config);
  await fetchAll();
  try {
    await doStartSprint()
  } catch (e) {
    if (e.message.indexOf(CHANGES_CONFLICT_ERROR) === -1) {
      throw e;
    }
    const {confirm} = await inquirer.confirmStash();
    if (!confirm) {
      throw new Error('Operation aborted.');
    }
    await stash();
    await doStartSprint();
  }

  async function doStartSprint() {
    const baseBranch = 'develop';
    const targetBranch = `${projectName}/sprint-${sprintNumber}`;
    await checkout(baseBranch);
    await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${baseBranch}`);
    await createAndCheckoutBranch(targetBranch);
    await push(targetBranch);
    console.log('sprint branch created successfully');
  }
}

async function stash() {
  await exec('git stash');
}

module.exports = {
  finishFeature,
  getConfig,
  isGitDirectory,
  setConfig,
  startFeature,
  startHotfix,
  startSprint
};
