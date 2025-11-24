module.exports = function pluginOptionsSchema({ Joi }) {
	return Joi.object({
		token: Joi.string().description(
			`Default token will be provided to subplugins to allow fetch data using GitHub GraphQL API v4. Though used for auth, this token is not directly shared.`
		),
		optimizedImagesKeyPrefix: Joi.string().description(
			`'optimizedsharpimage' by default`
		),
		generateOptimizedGitHubUserAvatarUrl: Joi.boolean().description(
			`Wether or not should generate the optimized version of the GitHub user [avatarUrl] field. Set to [false] if you do not want to. Defaults to [true].`
		),
		generateOptimizedGitHubRepositoryOpenGraphImageUrl:
			Joi.boolean().description(
				`Wether or not should generate the optimized version of the GitHub repository [openGraphImageUrl] field. Set to [false] if you do not want to. Defaults to [true].`
			),
		plugins: Joi.subPlugins().description(
			`A list of subplugins. See also: https://github.com/libsrcdev/gatsby-source-github-graphql for examples`
		),
	});
};