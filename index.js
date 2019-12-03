#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const inquirer = require('./lib/inquirer');
const git = require('./lib/git');
const github = require('./lib/github');
const program = require('commander');
const conf = new (require('configstore'))('gitflow');
const exec = require('util').promisify(require('child_process').exec);

program.version(
  JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json')))['version'] || 'test-mode', '-v, --version'
);

program
  .command('finish-feature')
  .description('Finish feature')
  .action(async () => {
    try {
      await git.bailIfNotGitDirectory();
      await git.finishFeature(git.getConfig(process.cwd()));
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('finish-hotfix')
  .description('Finish hotfix')
  .action(async () => {
    try {
      await git.bailIfNotGitDirectory();
      await git.finishHotfix(git.getConfig(process.cwd()));
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('finish-sprint')
  .description('Finish Sprint')
  .action(async () => {
    try {
      await git.bailIfNotGitDirectory();
      await git.finishSprint(git.getConfig(process.cwd()));
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('generate-token')
  .description('Generate Github personal access token to be used by gitflow')
  .action(async () => {
    try {
      await github.generateToken();
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('get-config')
  .description('Set default project and sprint number')
  .action(() => {
    try {
      console.log(git.getConfig(process.cwd()));
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('remove-token')
  .description('Remove Github personal access token from your local machine')
  .action(async () => {
    try {
      await github.removeToken();
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('set-config')
  .description('Set default project and sprint number')
  .action(async () => {
    try {
      const config = await inquirer.askProjectNameAndSprintNumber({projectName: null, sprintNumber: null});
      git.setConfig(process.cwd(), config);
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('start-feature')
  .arguments('[feature-branch]')
  .description('Create new feature branch')
  .action(async (featureBranch) => {
    try {
      await git.bailIfNotGitDirectory();
      await git.startFeature(git.getConfig(process.cwd()), featureBranch);
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('start-hotfix')
  .arguments('[hotfix-branch]')
  .description('Create new hotfix branch')
  .action(async (hotfixBranch) => {
    try {
      await git.bailIfNotGitDirectory();
      await git.startHotfix(hotfixBranch);
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('start-sprint')
  .arguments('[project] [sprint]')
  .description('Create new sprint branch')
  .action(async (project, sprint) => {
    try {
      await git.bailIfNotGitDirectory();
      await git.startSprint(git.getConfig(process.cwd()), project, sprint);
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('alias')
  .arguments('<alias> <cmd...>')
  .description('Create new alias for a command')
  .action(async (alias, cmd) => {
    const cmdAlias = {[`alias:${alias}`]: cmd.join(' ')};

    try {
      conf.set(cmdAlias);
      console.log(cmdAlias);
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('soft-push')
  .description('Perform soft push to trigger CI build')
  .action(async () => {
    try {
      await git.softPush();
    } catch (e) {
      console.log(e.message);
    }
  });

program.on('command:*', async (args) => {
  const alias = args.shift();
  let cmd = conf.get(`alias:${alias}`);
  const pkg = path.join(process.cwd(), '/package.json');

  // package.json alias overrides the common alias
  if (fs.existsSync(pkg)) {
    const {gitflow: {alias: aliases = {}} = {}} = require(pkg);
    cmd = aliases[alias] || cmd;
  }

  try {
    if (!cmd) {
      throw new Error(`Unknown command or alias: ${alias}`);
    }

    console.log(`> ${cmd} ${args.join(' ')}`);
    const proc = await exec(`${cmd} ${args.join(' ')}`).catch((err) => err);

    if (proc.stdout !== '') {
      console.log(proc.stdout);
    }
    if (proc.stderr !== '') {
      console.error(proc.stderr);
    }

    process.exit(proc.exitCode || proc.code);
  } catch (e) {
    console.log(e.message);
  }
});

program.parse(process.argv);
