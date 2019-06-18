function toDashCase(strWithSpace) {
  let lastCharIsSpace = false;
  let newStr = '';
  for(const char of strWithSpace) {
    if (char === ' ') {
      if (lastCharIsSpace) {
        continue;
      } else {
        newStr += '-';
      }
      lastCharIsSpace = true;
    } else {
      newStr += char;
      lastCharIsSpace = false;
    }
  }
  return newStr
}

function toIssueNumberAndName(branch, prefix = '') {
  if (prefix) {
    branch = branch.substring(prefix.length);
  }
  const arr = branch.split('-');
  const issueNumber = arr[0];
  if (isNaN(issueNumber)) {
    throw new Error(`Your branch name: "${branch}" is not in the format: {issue_number}-{feature_name}`)
  }
  const issueName = arr.slice(1).join(' ');
  if (!issueName) {
    throw new Error(`Your branch name: "${branch}" is not in the format: {issue_number}-{feature_name}`)
  }
  return {issueName, issueNumber};
}

function toSpaceCase(strWithDash) {
  return strWithDash.replace(/-/g, ' ');
}

module.exports = {
  toDashCase,
  toIssueNumberAndName,
  toSpaceCase
};
