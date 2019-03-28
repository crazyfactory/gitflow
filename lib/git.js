const Configstore = require('configstore');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const inquirer = require('./inquirer');
const conf = new Configstore('gitflow');

async function checkStatus() {
  const {stdout, stderr} = await exec('git status');
  console.log('stdout', stdout);
  console.log('stderr', stderr);
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

function setConfig(key, {projectName, sprintNumber}) {
  conf.set(`${key}projectName`, projectName);
  conf.set(`${key}sprintNumber`, sprintNumber);
}

async function startSprint(config) {
  const {projectName, sprintNumber} = await inquirer.askProjectNameAndSprintNumber(config);
  console.log('projectName', projectName);
  console.log('sprintNumber', sprintNumber);
}

module.exports = {
  checkStatus,
  getConfig,
  isGitDirectory,
  setConfig,
  startSprint
};
