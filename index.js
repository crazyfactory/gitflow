#!/usr/bin/env node
const fs = require('fs');
const inquirer = require('./lib/inquirer');
const git = require('./lib/git');
const github = require('./lib/github');
const program = require('commander');

program.version(JSON.parse(fs.readFileSync('./package.json'))['version'] || 'test-mode', '-v, --version');

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
  .description('Create new feature branch')
  .action(async () => {
    try {
      await git.bailIfNotGitDirectory();
      await git.startFeature(git.getConfig(process.cwd()));
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('start-hotfix')
  .description('Create new hotfix branch')
  .action(async () => {
    try {
      await git.bailIfNotGitDirectory();
      await git.startHotfix();
    } catch (e) {
      console.log(e.message);
    }
  });

program
  .command('start-sprint')
  .description('Create new sprint branch')
  .action(async () => {
    try {
      await git.bailIfNotGitDirectory();
      await git.startSprint(git.getConfig(process.cwd()));
    } catch (e) {
      console.log(e.message);
    }
  });

program.parse(process.argv);
