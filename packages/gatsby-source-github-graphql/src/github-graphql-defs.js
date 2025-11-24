const { mergeDeep } = require(`./utils`);

// Mirrored from GitHub GraphQL API types.
const DEFAULT_PLUGIN_GITHUB_NODE_TYPES = Object.freeze({
  DISCUSSION: `GitHubDiscussion`,
  REPOSITORY: `GitHubRepository`,
  REPOSITORY_TOPIC: `GitHubRepositoryTopic`,
  LANGUAGE: `GitHubLanguage`,
  REPOSITORY_OWNER: `GitHubRepositoryOwner`,
  TOPIC: `GitHubTopic`,
  LABEL: `GitHubLabel`,
  DISCUSSION_CATEGORY: `GitHubDiscussionCategory`,
  USER: `GitHubUser`,
  BOT: `GitHubBot`,
  ENTERPRISE_USER_ACCOUNT: `GitHubEnterpriseUserAccount`,
  MANNEQUIN: `GitHubMannequin`,
  ORGANIZATION: `GitHubOrganization`,
  ISSUE: `GitHubIssue`,
});

exports.DEFAULT_PLUGIN_GITHUB_NODE_TYPES = DEFAULT_PLUGIN_GITHUB_NODE_TYPES;

const DEFAULT_GITHUB_API_TYPES = Object.freeze({
  USER: `User`,
  ISSUE: `Issue`,
  DISCUSSION_ORDER_FIELD: {
    CREATED_AT: `CREATED_AT`,
    UPDATED_AT: `UPDATED_AT`,
  },
  ORDER_DIRECTION: {
    ASC: `ASC`,
    DESC: `DESC`,
  },
});

exports.DEFAULT_GITHUB_API_TYPES = DEFAULT_GITHUB_API_TYPES;

exports.getPluginNodeTypes = function (override) {
  return mergeDeep(DEFAULT_PLUGIN_GITHUB_NODE_TYPES, override ?? {});
};

exports.getGithubApiTypes = function getNodeTypes(override) {
  return mergeDeep(DEFAULT_GITHUB_API_TYPES, override ?? {});
};
