const { removeKey } = require(`./src/utils`);

const { createRemoteFileNode } = require(`gatsby-source-filesystem`);
const {
  getPluginNodeTypes
} = require("./src/github-graphql-defs");

module.exports = async function onCreateNode(...args) {
	const [
		{
			node,
			actions: { createNode, createNodeField },
			createNodeId,
			getCache,
		},
		pluginOptions,
	] = args;

	const pluginNodeTypes = getPluginNodeTypes(pluginOptions.pluginNodeTypes);

	const internalTypes = [...Object.values(pluginNodeTypes)];

	const checkIfIsInternalType = (type) => internalTypes.includes(type);

	const isInternalType = checkIfIsInternalType(node.internal.type);

	async function createFileNodeFrom({ node, key, fieldName } = {}) {
		if (typeof node[key] !== `string`) return;
		if (!node[key].startsWith(`http`)) return;

		const fileNode = await createRemoteFileNode({
			url: node[key],
			parentNodeId: node.id,
			createNode,
			createNodeId,
			getCache,
		});

		if (fileNode) {
			createNodeField({ node, name: fieldName ?? key, value: fileNode.id });
		}
	}

	// Allow subplugins make use of `onCreateNode` APIs.
	for (const plugin of pluginOptions.plugins) {
		const resolvedPlugin = plugin.module;
		const onCreateNode = resolvedPlugin.onCreateNode;

		const subpluginOptions = plugin.pluginOptions;

		const githubSourcePlugin = {
			createFileNodeFrom,
			checkIfIsInternalType,
			isInternalType,
			pluginNodeTypes,
		};

		const subpluginArgs = [
			{ ...args[0], githubSourcePlugin },
			{
				...removeKey(subpluginOptions, `token`),
			},
			...args.slice(2),
		];

		if (typeof onCreateNode === `function`) {
			onCreateNode(...subpluginArgs);
		}
	}

	// Allow end-users make use of `onCreateNode` APIs.
	if (typeof pluginOptions?.onCreateNode === `function`) {
		const githubSourcePlugin = {
			createFileNodeFrom,
			checkIfIsInternalType,
			isInternalType,
			pluginNodeTypes,
		};

		pluginOptions.onCreateNode(
			...[
				{
					...args[0],
					githubSourcePlugin,
				},
				{
					...removeKey(args[1], `token`),
				},
				...args.slice(2),
			]
		);
	}

	if (!isInternalType) return;

	async function handleImageOptimizationForNode({
		node,
		targetNodeType,
		key,
		optionableKey,
	}) {
		const IMAGE_OPTIMIZATION_KEY_SUFFIX = `SharpOptimized`;

		if (node.internal.type !== targetNodeType) return;

		if (pluginOptions[optionableKey] !== false) {
			if (key in node) {
				await createFileNodeFrom({
					node,
					key: key,
					// This is also linked on [createSchemaCustomization] step. See the [pluginNodeTypes.USER] type def.
					fieldName: key + IMAGE_OPTIMIZATION_KEY_SUFFIX,
				});
			}
		}
	}

	const targetOptimizationOptions = [
		{
			targetNodeType: pluginNodeTypes.USER,
			key: `avatarUrl`,
			optionableKey: `generateOptimizedGitHubUserAvatarUrl`,
		},
		{
			targetNodeType: pluginNodeTypes.REPOSITORY,
			key: `openGraphImageUrl`,
			optionableKey: `generateOptimizedGitHubRepositoryOpenGraphImageUrl`,
		},
	];

	for (const options of targetOptimizationOptions) {
		await handleImageOptimizationForNode({ ...options, node });
	}

	// for (const key in node) {
	//   /**
	//    * Any key of any node of this plugin that has a key ending with `optimizedsharpimage`
	//    * will be automatically optimized.
	//    * This way subplugins can return the data like:
	//    * ```
	//    * return {
	//    *   ...user,
	//    *   avatarOptimizedSharpImage: user.avatarUrl, // optimized version of the avatarUrl of the user
	//    * }
	//    * ```
	//    */
	//   if (key.toLowerCase().endsWith(`optimizedsharpimage`)) {
	//     await createFileNodeFrom({node, key})
	//   }
	// }
};