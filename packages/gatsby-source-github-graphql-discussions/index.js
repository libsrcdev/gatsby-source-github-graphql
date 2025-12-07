const { fetchDiscussions } = require("./discussions");

async function getRepositoryDiscussions({
  owner,
  repo,
  categoryIds,
  categorySlugs,
  maxDiscussionsCount,
  orderByDirection,
  orderByField,
  graphql,
  githubApiTypes,
  githubPlainResolverFields,
}) {
  const fetchOnceWithoutFilters = [{}];

  const compareField =
    orderByField === githubApiTypes.DISCUSSION_ORDER_FIELD.CREATED_AT
      ? `createdAt`
      : `updatedAt`;

  const desc = orderByDirection === githubApiTypes.ORDER_DIRECTION.DESC;

  const _ = (fn) => (a, z) =>
    fn(
      new Date(a[compareField]).getMilliseconds(),
      new Date(z[compareField]).getMilliseconds()
    );

  const compareFn = _((a, z) => (desc ? z - a : a - z));

  const filters =
    categoryIds != null
      ? categoryIds.map((categoryId) => ({ categoryId }))
      : categorySlugs != null
      ? categorySlugs.map((categorySlug) => ({ categorySlug }))
      : fetchOnceWithoutFilters;

  const discussions = (
    await Promise.all(
      filters.map((filter) =>
        fetchDiscussions(owner, repo, {
          resultsLimit: maxDiscussionsCount,
          orderByDirection,
          orderByField,
          ...filter,
          graphql,
          githubPlainResolverFields,
        })
      )
    )
  ).reduce((previous, current) => [...previous, ...current], []);
  discussions.sort(compareFn);

  return discussions;
}

module.exports.sourceNodes = async (
  {
    actions: { createNode },
    createContentDigest,
    createNodeId,
    githubSourcePlugin,
  },
  pluginOptions
) => {
  pluginOptions = { ...(pluginOptions ?? {}) };

  const {
    graphql,
    githubPlainResolverFields,
    pluginNodeTypes,
    githubApiTypes,
  } = githubSourcePlugin;

  const DEFAULT_OPTIONS = {
    orderByDirection: githubApiTypes.ORDER_DIRECTION.DESC,
    orderByField: githubApiTypes.DISCUSSION_ORDER_FIELD.CREATED_AT,
  };

  const options = Object.assign({}, DEFAULT_OPTIONS, pluginOptions);

  const { mapDiscussions } = options;

  const discussions = await getRepositoryDiscussions({
    ...options,
    graphql,
    githubApiTypes,
    githubPlainResolverFields,
  });

  const mappedDiscussions = discussions.map((discussion) =>
    (mapDiscussions ?? ((_) => _))(discussion)
  );

  return {
    [pluginNodeTypes.DISCUSSION]: mappedDiscussions,
    [pluginNodeTypes.LABEL]: mappedDiscussions
      .map((discussion) => discussion.labels)
      .reduce((previous, current) => [...previous, ...current], []),
    [pluginNodeTypes.USER]: mappedDiscussions.map(
      (discussion) => discussion.author
    ),
    [pluginNodeTypes.DISCUSSION_CATEGORY]: mappedDiscussions.map(
      (discussion) => discussion.category
    ),
  };
};

module.exports.onCreateNode = async (
  { node, isInternalType, githubSourcePlugin: { createFileNodeFrom } },
  pluginOptions
) => {
  if (!isInternalType) return;
};

module.exports.createSchemaCustomization = (
  { actions, githubSourcePlugin: { pluginNodeTypes } },
  pluginOptions
) => {
  const { createTypes } = actions;

	// FIXME: The 'discussions' field on the User type is not working
  const typeDefs = `
    type ${pluginNodeTypes.USER} implements Node {
      discussions: [${pluginNodeTypes.DISCUSSION}] @link(by: "author.id", from: "githubId")
    }
    type ${pluginNodeTypes.DISCUSSION} implements Node {
      author: ${pluginNodeTypes.USER} @link(from: "author.id", by: "githubId")
      labels: [${pluginNodeTypes.LABEL}] @link(from: "labels.id", by: "githubId")
      category: ${pluginNodeTypes.DISCUSSION_CATEGORY} @link(from: "category.id", by: "githubId")
    }
    type ${pluginNodeTypes.DISCUSSION_CATEGORY} implements Node {
      discussions: [${pluginNodeTypes.DISCUSSION}] @link(by: "category.id", from: "githubId")
    }
  `;
  createTypes(typeDefs);
};
