const githubOctokit = require(`./src/github-octokit`);
const { removeKey } = require(`./src/utils`);
const { getGithubPlainResolverFields } = require(`./src/plugin-github-fragments`);

const {
  getPluginNodeTypes,
  getGithubApiTypes,
} = require("./src/github-graphql-defs");
const { MEDIA_TYPES } = require(`./src/media-types`);

module.exports = async function sourceNodes(...args) {
  const [
    {
      actions: { createNode },
      createContentDigest,
      createNodeId,
      getNodesByType,
    },
    userPluginOptions,
  ] = args;

  const pluginOptions = userPluginOptions ?? {};

  const { token, pluginNodeTypes: userPluginNodeTypes } = pluginOptions;

  const rawSubpluginsData = [];

  const githubApiTypes = getGithubApiTypes();
  const pluginNodeTypes = getPluginNodeTypes(userPluginNodeTypes);
  const githubPlainResolverFields = getGithubPlainResolverFields({
    pluginNodeTypes,
  });

  for (const plugin of pluginOptions.plugins ?? []) {
    const resolvedPlugin = plugin.module;

    const subpluginOptions = { ...(plugin.pluginOptions ?? {}) };

    // Allow all plugins to have a custom token implicitly.
    const { token: customToken } = subpluginOptions;

    const graphql = githubOctokit.createGraphQLWithAuth(customToken ?? token);

    const githubSourcePlugin = {
      graphql,
      githubPlainResolverFields,
      githubApiTypes,
      pluginNodeTypes,
    };

    const subpluginArgs = [
      { ...args[0], githubSourcePlugin },
      {
        ...removeKey(subpluginOptions, `token`),
      },
      ...args.slice(2),
    ];

    const pluginData = await resolvedPlugin?.sourceNodes?.(...subpluginArgs);

    // Plugins that doesn't return anything probably created
    // the nodes by their own, so just skip it.
    if (typeof pluginData === `undefined`) continue;

    for (const k in pluginData) {
      pluginData[k] = pluginData[k].map((data) => ({
        ...data,
        // Track each node instance by plugin.
        // This way we can filter the nodes by the source plugin.
        // This is required since we can fetch multiple repositories
        // for different purposes.
        meta: {
          plugin: plugin.name,
          key: subpluginOptions.key,
        },
      }));
    }

    // Otherwise they want we to create the nodes for them.
    rawSubpluginsData.push(pluginData);
  }

  const dataByType = {};

  for (const pluginData of rawSubpluginsData) {
    for (const k in pluginData) {
      dataByType[k] = [...(dataByType[k] ?? []), ...(pluginData[k] ?? [])];
    }
  }

  if (typeof pluginOptions?.createCustomMapper === `function`) {
    const customMapper = pluginOptions.createCustomMapper({
      githubSourcePlugin: { pluginNodeTypes },
    });

    for (const type of Object.values(pluginNodeTypes)) {
      const mapper = customMapper[type];

      if (typeof mapper !== `function`) continue;

      dataByType[type] = dataByType[type].map(mapper);
    }
  }

  /** [dataByType]:
   * {
   *   [pluginNodeTypes.USER]: [{ ...GitHubGraphQLUserType }, { ...GitHubGraphQLUserType }],
   *   [pluginNodeTypes.REPOSITORY]: [... /** Same as above *\/],
   *   ...
   * }
   */
  for (const type in dataByType) {
    // we do not recognize this node type, skip it.
    if (!Object.values(pluginNodeTypes).includes(type)) continue;

    const items = dataByType[type] ?? [];

    function getMediaType(nodeType) {
      switch (nodeType) {
        case pluginNodeTypes.DISCUSSION:
        case pluginNodeTypes.ISSUE:
          return MEDIA_TYPES.MARKDOWN;
        default:
          return undefined;
      }
    }

    function getNodeContent(node, type) {
      switch (type) {
        case pluginNodeTypes.DISCUSSION:
        case pluginNodeTypes.ISSUE:
          return node.body;
        default:
          return undefined;
      }
    }

    const mediaType = getMediaType(type);

    for (const item of items) {
      const content = getNodeContent(item, type);

      await createNode({
        ...item,
        githubId: item.id,
        id: createNodeId(`${type} >>> ${item.id}`),
        parent: null,
        children: [],
        internal: {
          type: type,
          contentDigest: createContentDigest(item),
          content: content,
          mediaType: mediaType,
        },
      });
    }
  }
};