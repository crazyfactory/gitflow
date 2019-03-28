#!/usr/bin/env node

const github = require('./lib/github');
const program = require('commander');
program
  .command('generate-token')
  .description('generate Github personal access token to be used by gitflow')
  .action(async () => {
    try {
      await github.generateToken();
    } catch (e) {
      console.log(e.message);
    }
  });
program
  .command('remove-token')
  .description('remove Github personal access token from your local machine')
  .action(async () => {
    try {
      await github.removeToken();
    } catch (e) {
      console.log(e.message);
    }
  });
program.parse(process.argv);
