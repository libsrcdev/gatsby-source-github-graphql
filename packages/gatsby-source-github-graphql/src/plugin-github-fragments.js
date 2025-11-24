exports.getGithubPlainResolverFields = ({ pluginNodeTypes }) => {
  const ABSTRACT_ACTOR_FIELDS = `
    avatarUrl
    login
    resourcePath
    url
    typename: __typename
  `;

  const fragments = {
    [pluginNodeTypes.USER]: `
      ${ABSTRACT_ACTOR_FIELDS}
      anyPinnableRepositories: anyPinnableItems(type: REPOSITORY)
      anyPinnableGists: anyPinnableItems(type: GIST)
      anyPinnableIssues: anyPinnableItems(type: ISSUE)
      anyPinnableProjects: anyPinnableItems(type: PROJECT)
      anyPinnablePullRequests: anyPinnableItems(type: PULL_REQUEST)
      anyPinnableUsers: anyPinnableItems(type: USER)
      anyPinnableOrganizations: anyPinnableItems(type: ORGANIZATION)
      anyPinnableTeams: anyPinnableItems(type: TEAM)
      bio
      bioHTML
      company
      companyHTML
      name
      createdAt
      updatedAt
      id
      databaseId
      email
      hasSponsorsListing
      isBountyHunter
      login
      isCampusExpert
      isDeveloperProgramMember
      isEmployee
      isGitHubStar
      isHireable
      isSiteAdmin
      isViewer
      isSponsoringViewer
      websiteUrl
      twitterUsername
      url
      viewerIsSponsoring
    `,
    [pluginNodeTypes.DISCUSSION]: `
      body
      createdAt
      updatedAt
      url
      id
      number
      title
      locked
      lastEditedAt
    `,
    [pluginNodeTypes.DISCUSSION_CATEGORY]: `
      name
      id
      createdAt
      description
      emoji
      emojiHTML
      isAnswerable
      slug
      updatedAt
    `,
    [pluginNodeTypes.LABEL]: `
      color
      createdAt
      description
      id
      isDefault
      name
      resourcePath
      updatedAt
      color
      url
    `,
  };

  // Allow usage as pluginFragments.DISCUSSION, pluginFragments.USER, etc.
  return Object.freeze(
    Object.keys(pluginNodeTypes).reduce((previous, current) => {
      return {
        ...previous,
        [current]: fragments[pluginNodeTypes[current]],
      };
    }, {})
  );
};
