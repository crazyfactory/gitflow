const Octokit = require('@octokit/rest');
const Configstore = require('configstore');
require('isomorphic-fetch');
const inquirer = require('./inquirer');
const conf = new Configstore('gitflow');
let octokit;

const TOKEN_NOTE = 'gitflow, the command-line tool for gitflow';
const TOKEN_KEY = 'github.token';
const SCOPES = ['user', 'repo'];

async function generateToken() {
  const credentials = await inquirer.askGithubCredentials();
  octokit = new Octokit({
    auth: credentials
  });

  let authorizations = [];
  let page = 1;

  let response;
  while (authorizations.length % 100 === 0) {
    response = await octokit.oauthAuthorizations.listAuthorizations({per_page: 100, page: page++});
    if (response.data.length === 0) {
      break;
    }
    authorizations = authorizations.concat(response.data);
  }

  const gitflowToken = authorizations.find((authorization) => authorization.note === TOKEN_NOTE);
  if (gitflowToken) {
    await octokit.oauthAuthorizations.deleteAuthorization({authorization_id: gitflowToken.id});
  }

  response = await octokit.oauthAuthorizations.createAuthorization({
    note: TOKEN_NOTE,
    scopes: SCOPES
  });

  conf.set(TOKEN_KEY, response.data.token);
  console.log('token generated');
}

async function initiateOctokit() {
  const token = conf.get(TOKEN_KEY);
  if (token) {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: {
        Authorization: `token ${token}`
      }
    });

    if (response.ok) {
      octokit = new Octokit({
        auth: `token ${token}`
      });
    }
    else {
      throw new Error(
        'Token is invalid. Please generate Github personal access token by running command: gitflow generate-token'
      )
    }
  }
  else {
    throw new Error(
      'No token found. Please generate Github personal access token by running command: gitflow generate-token'
    );
  }
}

async function removeToken() {
  conf.delete(TOKEN_KEY);
  console.log('token removed (locally)');
}

module.exports = {
  generateToken,
  removeToken
};
