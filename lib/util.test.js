const {toDashCase, toIssueNumberAndName, toSpaceCase} = require('./util');

describe('util', () => {
  it('toDashCase returns correct result', () => {
    expect(toDashCase('a b  c   d')).toBe('a-b-c-d');
  });

  describe('toIssueNumberAndName', () => {
    it('returns correct result', () => {
      expect(toIssueNumberAndName('1-feature-a')).toEqual({
        issueName: 'feature a',
        issueNumber: '1'
      });
    });

    it('throws if input is not in correct format', () => {
      expect(() => {
        toIssueNumberAndName('abc');
      }).toThrow('Your branch name is not in the format: {issue_number}-{feature_name}');

      expect(() => {
        toIssueNumberAndName('a-feature-a');
      }).toThrow('Your branch name is not in the format: {issue_number}-{feature_name}');
    })
  });

  it('toSpaceCase returns correct result', () => {
    expect(toSpaceCase('a-b-c-d')).toBe('a b c d');
  })
});
