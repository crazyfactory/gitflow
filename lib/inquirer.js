const inquirer = require('inquirer');

module.exports = {
  askGithubCredentials: () => {
    const questions = [
      {
        message: 'Enter your Github username',
        name: 'username',
        type: 'input',
        validate: (value) => value.length ? true : 'Please enter your username'
      },
      {
        message: 'Enter your password:',
        name: 'password',
        type: 'password',
        validate: (value) => value.length ? true : 'Please enter your password'
      },
      {
        type: 'confirm',
        message: 'Do you have 2FA enabled on your GitHub account?',
        name: '2FAEnabled',
      }
    ];
    return inquirer.prompt(questions);
  },
  askGithub2FactorAuthenticationCode: async () => {
    return inquirer.prompt([
      {
        type: 'input',
        message: 'Enter your Two-factor GitHub authenticator code',
        name: 'code',
      },
    ]).then(answers => answers.code)
  },
  askIssueNumberAndFeature: () => {
    const questions = [
      {
        message: 'issue number',
        name: 'issueNumber',
        type: 'input',
        validate: (value) => value ? (isNaN(value) ? '' : true) : 'Please enter issue number'
      },
      {
        message: 'feature',
        name: 'feature',
        type: 'input',
        validate: (value) => value ? true : 'Please enter feature'
      }
    ];
    return inquirer.prompt(questions);
  },
  askIssueNumberAndHotfix: () => {
    const questions = [
      {
        message: 'issue number',
        name: 'issueNumber',
        type: 'input',
        validate: (value) => value ? (isNaN(value) ? '' : true) : 'Please enter issue number'
      },
      {
        message: 'hotfix',
        name: 'hotfix',
        type: 'input',
        validate: (value) => value ? true : 'Please enter hotfix'
      }
    ];
    return inquirer.prompt(questions);
  },
  askProjectNameAndSprintNumber: ({projectName, sprintNumber}) => {
    const questions = [
      {
        default: projectName,
        message: 'project name',
        name: 'projectName',
        type: 'input',
        validate: (value) => value ? true : 'Please enter project name'
      },
      {
        default: sprintNumber,
        message: 'sprint number',
        name: 'sprintNumber',
        type: 'input',
        validate: (value) => value ? (isNaN(value) ? 'Sprint should be number' : true) : 'Please enter sprint number'
      }
    ];
    return inquirer.prompt(questions);
  },
  confirmFinishing: (message) => {
    const question = {
      message,
      name: 'confirm',
      type: 'confirm'
    };
    return inquirer.prompt(question)
  },
  promptStash: () => {
    const question = {
      message: 'You have some local changes. Enter label to stash them.\n  (Press ENTER to abort process, Type `.` to discard changes and continue.)',
      name: 'stashLabel',
      type: 'input'
    };
    return inquirer.prompt(question)
  }
};
