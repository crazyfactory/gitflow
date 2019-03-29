#!/usr/bin/env node

const inquirer = require('./lib/inquirer');
const git = require('./lib/git');
const github = require('./lib/github');
const program = require('commander');
program
  .command('finish-feature')
  .description('Finish feature')
  .action(async () => {
    try {
      const isGitDirectory = await git.isGitDirectory();
      if (!isGitDirectory) {
        console.log('You are not in a git directory');
        return;
      }
      await git.finishFeature(git.getConfig(process.cwd()));
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
      const isGitDirectory = await git.isGitDirectory();
      if (!isGitDirectory) {
        console.log('You are not in a git directory');
        return;
      }
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
      const isGitDirectory = await git.isGitDirectory();
      if (!isGitDirectory) {
        console.log('You are not in a git directory');
        return;
      }
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
      const isGitDirectory = await git.isGitDirectory();
      if (!isGitDirectory) {
        console.log('You are not in a git directory');
        return;
      }
      await git.startSprint(git.getConfig(process.cwd()));
    } catch (e) {
      console.log(e.message);
    }
  });
program.parse(process.argv);
