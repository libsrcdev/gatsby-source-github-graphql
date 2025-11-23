const path = require("path")

require(`dotenv`).config()

module.exports = {
  siteMetadata: {
    title: `Gatsby GitHub GraphQL Source`,
    description: `Fetch data from GitHub and keep the connections and relationships between nodes.`,
    author: `@libsrcdev`,
    siteUrl: `https://github.com/libsrcdev/gatsby-source-github-graphql`,
  },
  plugins: [
    {
      resolve: `gatsby-source-github-graphql`,
      options: {
        onCreateNode: async ({
          node,
          isInternalType,
          createContentDigest,
          createNodeId,
          actions: { createNode },
          githubSourcePlugin: { pluginNodeTypes },
        }) => {
          if (node.internal.type === pluginNodeTypes.DISCUSSION) {
            const content = node.myOtherFieldAsMarkdown

            await createNode({
              id: createNodeId(`${node.id} >>> ${content}`),
              discussionId: node.id,
              children: [],
              internal: {
                type: `MyCustomMarkdownNodeType`,
                mediaType: `text/markdown`,
                content,
                contentDigest: createContentDigest(content),
              },
            })
          }
        },
        createSchemaCustomization: ({
          actions: { createTypes },
          githubSourcePlugin: { pluginNodeTypes },
        }) => {
          const typedefs = `
            type ${pluginNodeTypes.DISCUSSION} implements Node {
              myOtherFieldAsMarkdown: MyCustomMarkdownNodeType @link(from: "id", by: "discussionId")
            }
          `
          createTypes(typedefs)
        },
        createCustomMapper: ({ githubSourcePlugin: { pluginNodeTypes } }) => {
          return {
            [pluginNodeTypes.DISCUSSION]: discussion => {
              return {
                ...discussion,
                myCustomField: `Something`,
                myOtherFieldAsMarkdown: `## Hi\n\nThis is a paragraph.`,
              }
            },
          }
        },
        token: process.env.GITHUB_TOKEN,
        plugins: [
          {
            // Plugin to fetch all discussions of a repository and adding markdown features to the [discussion.body] field.
            resolve: `gatsby-source-github-graphql-discussions`,
            options: {
              owner: `libsrcdev`,
              repo: `gatsby-blog-example`,
              categorySlugs: [`Published`],
            },
          },
          {
            // Plugin to fetch sponsors and sponsoring data of the given user [login].
            resolve: `gatsby-source-github-graphql-sponsors`,
            options: {
              login: `kotx`,
            },
          },
          {
            // Plugin to fetch all repositories of a given user [login].
            resolve: `gatsby-source-github-graphql-user-repos`,
            options: {
              // Limit to 3 repositories to avoid 429 error (too many requests).
              // If you have a development environment: limit: process.env.NODE_ENV === "development" ? 3 : undefined,
              limit: 3,

              // Target user account.
              login: `libsrcdev`,

              // Wether or not should fetch only locked repos, remove or set to [null] to omit this filter.
              isLocked: false,

              // [null] means both, private and public (will include private if you are authenticated as this user).
              privacy: `PUBLIC`,

              // Wether should fetch only forks or not, remove or set to [null] to omit this filter.
              isFork: false,

              // Viewer affiliations
              affiliations: [`OWNER`, `COLLABORATOR`],

              // [login] user affiliation, same effect if you are logged as user A and is fetching the repositories of the same user A.
              ownerAffiliations: [`OWNER`, `COLLABORATOR`],
            },
          },
          {
            resolve: `gatsby-source-github-graphql-get-user`,
            options: {
              // The option you marked as optional, lets provide it:
              login: `CarlosZoft`, // Remember to try it without this option to see it working through the provided [token]!
            },
          },
        ],
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-plugin-image`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [`gatsby-remark-images-remote`],
      },
    },
  ],
}
