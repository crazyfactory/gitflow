const inquirer = require('inquirer');

module.exports = {
  askGithubCredentials: () => {
    const questions = [
      {
        name: 'username',
        type: 'input',
        message: 'Enter your Github username',
        validate: (value) => value.length ? true : 'Please enter your username'
      },
      {
        name: 'password',
        type: 'password',
        message: 'Enter your password:',
        validate: (value) => value.length ? true : 'Please enter your password'
      }
    ];
    return inquirer.prompt(questions);
  }
};
