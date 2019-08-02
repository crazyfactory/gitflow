# Gitflow

## Install
```sh
$ npm install -g @crazyfactory/gitflow
```

## Usages

### `$ gitflow set-config`
Set `project_name` and `sprint_number` for current path
  
### `$ gitflow get-config`
Get `project_name` and `sprint_number` for current path
  
### `$ gitflow generate-token`
Fill in your Github username and password to let Gitflow create personal access token

### `$ gitflow remove-token`
Delete personal access token locally

### `$ gitflow start-sprint [project] [sprintNum]`
  - Create new local sprint branch
  - Branch out from `origin/develop`
  - Naming convention: `{project_name}/sprint-{sprint_number}`
  - Push to origin

### `$ gitflow finish-sprint` 
  - Switch to `origin/{project_name}/sprint-{sprint_number}`
  - Create pull and fill content `Closes #{issue_number}` to `origin/develop` 
  - Switch local to `origin/develop`

### `$ gitflow start-feature [feature-branch]`
  - Create new local feature branch
  - If project is maintenance, branch out from `develop`, otherwise branch out from `origin/{project_name}/sprint-{number}`
  - Naming convention: `{project_name}-sprint-{number}/{issue_number}-{feature_name}`
  - Push to origin

### `$ gitflow finish-feature`
  - Push local branch to origin
  - If project name is maintenance create pull to `develop`, otherwise create pull to `origin/{project_name}/sprint-{sprint_number}`. Then fill content `Closes #{issue_number}`. 
  - Switch local to `origin/{project_name}/sprint-{sprint_number}`

### `$ gitflow start-hotfix [hotfix-branch]`
  - Create a new local hotfix branch
  - Branch out from `origin/master`
  - Naming convention: `{issue_number}-{hotfix_name}`
  - Push to origin

### `$ gitflow finish-hotfix`
  - Push local branch to origin
  - Create pull and fill content `Closes #{issue_number}` to `origin/master`
  - Switch local branch to `origin/master`
