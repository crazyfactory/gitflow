const Configstore = require('configstore');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const github = require('./github');
const inquirer = require('./inquirer');
const {toDashCase, toIssueNumberAndName} = require('./util');
const conf = new Configstore('gitflow');

const CHANGES_CONFLICT_ERROR = 'Your local changes to the following files would be overwritten by checkout';
const DEFAULT_REMOTE = 'origin';
const HOTFIX_PREFIX = 'hotfix/';
const MAINTENANCE_PROJECT = 'maintenance';
const DEVELOP_BRANCH = 'develop';

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
  await doStash();

  const {projectName, sprintNumber} = await inquirer.askProjectNameAndSprintNumber(config);
  const {confirm} = await inquirer.confirmFinishing(
    `Are you sure, you finished sprint ${sprintNumber} of ${projectName}`
  );
  if (!confirm) {
    throw new Error('Operation aborted');
  }
  await fetchAll();
  await doFinishSprint();

  async function doFinishSprint() {
    const baseBranch = DEVELOP_BRANCH;
    const targetBranch = `${projectName}/sprint-${sprintNumber}`;

    // get up-to-date data of both base branch and target branch
    await checkout(baseBranch);
    await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${baseBranch}`);
    await checkout(targetBranch);
    await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${targetBranch}`);
    let str = await getCommitsOfCurrentBranch();
    const commits = str.split('\n');
    const issuesToBeClosed = [];
    const {owner, repo} = await getOwnerAndRepo();
    for (let commit of commits) {
      commit = commit.trim(); // in case there is \r
      const hash = commit.split(' ')[0];
      str = await getBranchesContainingCommit(hash);
      const branches = str.split('\n').map((branch) => branch.trim());
      if (branches.find((branch) => branch === baseBranch)) {
        break;
      }
      const commitMessage = commit.substring(commit.indexOf(' ') + 1);
      if (commitMessage.indexOf('Merge pull request') !== -1) {
        const issue = toIssueNumberAndName(commitMessage.substring(commitMessage.lastIndexOf('/') + 1));
        issuesToBeClosed.push(issue);
      }
    }

    let body = issuesToBeClosed.map((issue) => `Closes #${issue.issueNumber} - ${issue.issueName}`);
    body = body.join('\n');
    await github.initiateOctokit();
    const response = await github.createPull(
      {owner, repo, title: targetBranch, head: targetBranch, base: baseBranch, body}
    );
    console.log(`pull request created successfully at ${response.data.html_url}`);
    await checkout(baseBranch);
    await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${baseBranch}`);
    console.log(`switch branch to ${baseBranch}`);
  }
}

async function finishHotfix() {
  const branch = await getCurrentBranch();
  if (!branch) {
    throw new Error('You are not in any branch (detached HEAD?)');
  }

  await doStash();

  const {issueName, issueNumber} = toIssueNumberAndName(branch, HOTFIX_PREFIX);
  const {confirm} = await inquirer.confirmFinishing(`Are you sure, you finished ${issueName}`);
  if (!confirm) {
    throw new Error('Operation aborted');
  }
  await push(branch);
  const {owner, repo} = await getOwnerAndRepo();
  await github.initiateOctokit();
  const prToMasterResponse = await github.createPull(
    {owner, repo, title: branch, head: branch, base: 'master', body: `Closes #${issueNumber}`}
  );
  console.log(`pull request to master created successfully at ${prToMasterResponse.data.html_url}`);

  await fetchAll();
  await checkout('master');
  await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/master`);
  console.log('switched branch to master');
}

async function finishFeature(config) {
  const branch = await getCurrentBranch();
  if (!branch) {
    throw new Error('You are not in any branch (detached HEAD?)');
  }

  await doStash();

  const {projectName, sprintNumber} = await inquirer.askProjectNameAndSprintNumber(config);
  const baseBranch = projectName === MAINTENANCE_PROJECT ? DEVELOP_BRANCH : `${projectName}/sprint-${sprintNumber}`;
  const {confirm} = await inquirer.confirmFinishing(`Are you sure, you finished ${branch} of ${baseBranch}`);
  if (!confirm) {
    throw new Error('Operation aborted');
  }
  await push(branch);
  const {owner, repo} = await getOwnerAndRepo();
  const {issueNumber} = toIssueNumberAndName(branch, `${projectName}-sprint-${sprintNumber}/`);
  await github.initiateOctokit();
  const response = await github.createPull(
    {owner, repo, title: branch, head: branch, base: baseBranch, body: `Closes #${issueNumber}`}
  );
  console.log(`pull request created successfully at ${response.data.html_url}`);

  await fetchAll();
  await checkout(baseBranch);
  await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${baseBranch}`);
  console.log(`switch branch to ${baseBranch}`);
}

async function getBranchesContainingCommit(hash) {
  const {stdout} = await exec(`git branch --contains ${hash}`);
  return stdout.trim();
}

async function getCommitsOfCurrentBranch() {
  const {stdout} = await exec('git log --pretty=oneline');
  return stdout.trim();
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

async function isClean() {
  try {
    const {exitCode} = await exec('git diff --quiet');
    return exitCode !== 0;
  } catch (e) {
    return false;
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

async function bailIfNotGitDirectory() {
  if (! await isGitDirectory()) {
    console.error('You are not in a git directory');
    process.exit(1);
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

async function doStash() {
  if (await isClean()) {
    return;
  }

  const {stashLabel} = await inquirer.promptStash();
  if (!stashLabel) {
    throw new Error('Operation aborted.');
  }

  if (stashLabel === '.') {
    await checkout('.');
    return;
  }

  await stash(stashLabel.replace(/"|'/g, ''));
}

async function softPush() {
  await exec('git commit --allow-empty -m "chore(ci): trigger build"');

  await exec('git push origin HEAD');
}

async function startFeature(config, featureBranch) {
  await doStash();

  const {projectName, sprintNumber} = await inquirer.askProjectNameAndSprintNumber(config);
  const parts = (featureBranch || '').match(/^(\d+)-(.*)/) || [];
  if (featureBranch && !parts.length) {
    console.log('invalid target feature branch');
  }
  const {issueNumber, feature} = parts.length
    ? {issueNumber: parts[1], feature: parts[2]}
    : await inquirer.askIssueNumberAndFeature();

  const refinedFeature = toDashCase(feature);
  const baseBranch = projectName === MAINTENANCE_PROJECT ? DEVELOP_BRANCH : `${projectName}/sprint-${sprintNumber}`;
  const targetBranch = `${projectName}-sprint-${sprintNumber}/${issueNumber}-${refinedFeature}`;

  await fetchAll();
  await checkout(baseBranch);
  await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${baseBranch}`);
  await createAndCheckoutBranch(targetBranch);
  await push(targetBranch);
  console.log('feature branch created successfully');
}

async function startHotfix(hotfixBranch) {
  await doStash();

  let targetBranch = hotfixBranch ? `hotfix/${hotfixBranch}` : '';
  const shouldAsk = targetBranch === '' || !/^\d+-./.test(hotfixBranch);

  if (shouldAsk) {
    if (hotfixBranch) {
      console.log('invalid hotfix target branch');
    }
    const {hotfix, issueNumber} = await inquirer.askIssueNumberAndHotfix();
    const refinedHotfix = toDashCase(hotfix);
    targetBranch = `hotfix/${issueNumber}-${refinedHotfix}`;
  }

  const baseBranch = 'master';
  await fetchAll();
  await checkout(baseBranch);
  await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${baseBranch}`);
  await createAndCheckoutBranch(targetBranch);
  await push(targetBranch);
  console.log('hotfix branch created successfully');
}

async function startSprint(config, project, sprint) {
  await doStash();

  const shouldAsk = !project || !/^\d+$/.test(sprint || '');
  let targetBranch = shouldAsk ? '' : `${project}/sprint-${sprint}`;

  if (shouldAsk) {
    if (project) {
      console.log('invalid sprint number');
    }
    const {projectName, sprintNumber} = await inquirer.askProjectNameAndSprintNumber(config);
    targetBranch = `${projectName}/sprint-${sprintNumber}`;
  }

  const baseBranch = DEVELOP_BRANCH;
  await fetchAll();
  await checkout(baseBranch);
  await resetHardToRemoteBranch(`${DEFAULT_REMOTE}/${baseBranch}`);
  await createAndCheckoutBranch(targetBranch);
  await push(targetBranch);
  console.log('sprint branch created successfully');
}

async function stash(label) {
  await exec(`git stash push -m "${label || 'wip'}"`);
}

module.exports = {
  finishFeature,
  finishHotfix,
  finishSprint,
  getConfig,
  isGitDirectory,
  bailIfNotGitDirectory,
  setConfig,
  softPush,
  startFeature,
  startHotfix,
  startSprint
};
