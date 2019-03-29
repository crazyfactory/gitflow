const Configstore = require('configstore');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const inquirer = require('./inquirer');
const conf = new Configstore('gitflow');

const CHANGES_CONFLICT_ERROR = 'Your local changes to the following files would be overwritten by checkout';
const REMOTE = 'origin';

async function checkout(branch) {
  await exec(`git checkout ${branch}`);
}

async function createAndCheckoutBrnach(branch) {
  await exec(`git checkout -b ${branch}`);
}

async function fetchAll() {
  await exec('git fetch --all');
}

async function finishSprint(config) {
  const {projectName, sprintNumber} = await inquirer.askProjectNameAndSprintNumber(config);
  const branch = `${projectName}/sprint-${sprintNumber}`;
  const {confirm} = await inquirer.confirmFinishingSprint({projectName, sprintNumber});
  if (!confirm) {
    console.log('Operation aborted');
    return;
  }
  await fetchAll();
  try {
    await checkout(branch);
    await resetHardToRemoteBranch(`${REMOTE}/${branch}`)
  } catch (e) {

  }
}

function getConfig(key) {
  const projectName = conf.get(`${key}projectName`);
  const sprintNumber = conf.get(`${key}sprintNumber`);
  return {projectName, sprintNumber};
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
  await exec(`git push -u ${REMOTE} ${branch}`);
}

async function resetHardToRemoteBranch(remoteBranch) {
  await exec(`git reset --hard ${remoteBranch}`);
}

function setConfig(key, {projectName, sprintNumber}) {
  conf.set(`${key}projectName`, projectName);
  conf.set(`${key}sprintNumber`, sprintNumber);
}

async function startSprint(config) {
  const {projectName, sprintNumber} = await inquirer.askProjectNameAndSprintNumber(config);
  const branch = `${projectName}/sprint-${sprintNumber}`;
  await fetchAll();
  try {
    await doStartSprint()
  } catch (e) {
    if (e.message.indexOf(CHANGES_CONFLICT_ERROR) === -1) {
      console.log(e.message);
      return;
    }
    const {confirm} = await inquirer.confirmStash();
    if (!confirm) {
      console.log('Operation aborted');
      return;
    }
    await stash();
    await doStartSprint();
  }

  async function doStartSprint() {
    await checkout('develop');
    await resetHardToRemoteBranch(`${REMOTE}/develop`);
    await createAndCheckoutBrnach(branch);
    await push(branch);
  }
}

async function stash() {
  await exec('git stash');
}

module.exports = {
  getConfig,
  isGitDirectory,
  setConfig,
  startSprint
};
