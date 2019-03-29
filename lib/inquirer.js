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
  confirmFinishingSprint: ({projectName, sprintNumber}) => {
    const question = {
      message: `Are you sure, you finished sprint ${sprintNumber} of ${projectName}`,
      name: 'confirm',
      type: 'confirm'
    };
    return inquirer.prompt(question)
  },
  confirmStash: () => {
    const question = {
      message: 'You have changes that would be overwritten. Do you want to stash them?',
      name: 'confirm',
      type: 'confirm'
    };
    return inquirer.prompt(question)
  }
};
