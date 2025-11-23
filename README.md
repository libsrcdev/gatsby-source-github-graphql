# gatsby-source-github-graphql

Gatsby Source GitHub GraphQL is a Gatsby source plugin that fetches data from GitHub GraphQL API and makes it available in the Gatsby GraphQL Data Layer. It supports subplugins to fetch specific GitHub resources and create relationships between them.

## Features

- It does **NOT** support Incremental Builds (not tested at least).
- It does **NOT** CMS Preview (not tested at least).
- It does **SUPPORT** image optimizations.
- It does **NOT** support gif optimizations, [simply because Gatsby does not](https://github.com/gatsbyjs/gatsby/issues/23678).
- It **PARTIALLY SUPPORTS** the GraphQL Data Layer, if you use-case is not supported yet, feel free to check [how to create a subplugin](#how-to-create-a-subplugin).

## Installation

> **Warning** this is not npm hosted, so be careful if you want to depend on it, I recommend a fork instead a direct dependency.

This package is not published to npm yet, you need to install using [gitpkg](https://gitpkg.now.sh/).

```shell
npm install @libsrcdev/gatsby-source-github-graphql
```

## Usage

```js
// gatsby-node.js
module.exports = {
  // ...
  plugins: [
    {
      resolve: `@libsrcdev/gatsby-source-github-graphql`,
      // Required, GitHub only allow authenticated requests.
      // Your token is not shared across subplugins even if you specify a custom token to it.
      token: process.env.GITHUB_TOKEN,
      options: {
        plugins: [
          {
            resolve: `@libsrcdev/gatsby-source-github-graphql-discussions`,
            options: {
              owner: `<your-target-username>`,
              repo: `<your-target-user-repo>`
            },
          },
          {
            // You can duplicate the plugins to fetch data from multiple times from different sources.
            resolve: `@libsrcdev/gatsby-source-github-graphql-discussions`,
            options: {
              owner: `<your-another-target-username>`,
              repo: `<another-target-user-repo>`,
              // Optional, only if you want to override the token previously defined for this plugin instance in particular.
              token: process.env.SOME_ANOTHER_GITHUB_TOKEN
            },
          }
        ]
      }
    } 
  ]
}
```

## Why does it exists

Because I'm building my blog that will be soon available at [alexcastro.dev](https://alexcastro.dev) and was searching for a plugin that fill these requirements:

- Fetch data from GitHub GraphQL API.
- Supports Gatsby GraphQL Data Layer.
- Supports image optimization.
- Markdown compatible (or any other markup).

### Where these requirements come from?

- Fetch data from GitHub, well - this is my data source.
- Supports Gatsby GraphQL Data Layer, this is the hard one which I kept in my requirements list for some reasons:
  1. I want to make total use of Gatsby GraphQL Data Layer (as we already have in CMS specific plugins like [gatsbyjs/gatsby/packages/gatsby-source-contentful](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-contentful) or [TryGhost/gatsby-source-ghost](https://github.com/TryGhost/gatsby-source-ghost/)).
  2. I want to apply any of Gatsby optimization and transformer plugins to any of the GitHub resource types (e.g repo, user, issue, discussion, file, etc.): is it a repository? optimize it's open graph image url; is it a user? optimize it's avatar url; is it a markdown file? mark it's contents as markdown media type to optimize using MarkdownRemark.
  3. From the previous point I also wanted to make it easy to extend and easy to replace, so I'll be able to extend when a use-case is missing but I'll also be able to replace in case of my use-case is different, e.g: if I've a plugin that optimize all GitHub issues as markdown files but instead I want to optimize as AsciiDoc files (or any custom processing), what should I do?
- Supports image optimization, bandwidth bla-bla - this is also important but lets talk about this motherf [web.dev/optimize-cls](https://web.dev/optimize-cls/).
- Markdown compatible (or any other markup), at this moment I'm using the discussions of a repository as markdown files to build a blog, but what if I want to switch in the future, or maybe change the processing rule or package?

### What I've tried before

- [mosch/gatsby-source-github](https://github.com/mosch/gatsby-source-github/blob/master/src/gatsby-node.js) this unfortunately only supports fetching the file tree and the releases of a repository.
- [ldd/gatsby-source-github-api](https://github.com/ldd/gatsby-source-github-api) which also doesn't support relationships. All nodes are the same type, which means there are no connection between data required; there are only flat nodes (of type `GithubData`).
- [stevetweeddale/gatsby-source-git](https://github.com/stevetweeddale/gatsby-source-git) useful only if you pulling you repository markdown tree.
- [gatsbyjs/gatsby/packages/gatsby-source-graphql](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-graphql) this also has known limitation:
  > This plugin has [known limitations](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-source-graphql#known-limitations), specifically in that 1. it does not support Incremental Builds, 2. CMS Preview, 3. image optimizations, 4. and lack of full support for the GraphQL data layer.

### Solution?

This monorepo is a Gatsby data source plugin + set of source subplugins which aims to provide a granular way to fetch typed and connected GitHub data chunks.

Technically saying:

- Let `coreplugin` be the actual Gatsby source plugin that is plugged directly into your `gatsby-config.js` and it's available under _/packages/gatsby-source-github-graphql_.
- Let `subplugin` be any Gatsby subplugin (under your Gatsby project at _/plugins/your-gatsby-plugin-that-will-be-used-as-subplugin_ or one of the already supported plugins at _/packages/gatsby-source-github-graphql-some-cool-usecase_ in this repo).
- The `coreplugin` request it's subplugins to fetch what data they want to `coreplugin.sourceNodes -> subplugins.sourceNodes`.
- Then the `coreplugin` connect the edges by creating the nodes by it's types `coreplugin.onCreateNodes`.
- And finally the `coreplugin` request it's subplugins again to create the schema customization through `subplugin.createSchemaCustomization`.

This is an answer and a question because I don't know if it's ok to create plugins in this way, I tried to copy/keep the same essence of [gatsbyjs/gatsby/packages/gatsby-transformer-remark](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-transformer-remark) but I'm not sure if it's sustentable, I did it only for personal use while trying to make it easy for me to extend in case of in the future adding some blog feature or modify an existing one.

But as always, do you have an idea or recommendation? just push it into the issues stack. Your use-case is not supported yet? feel free [to create a subplugin](#how-to-create-a-subplugin) and open a pull request.

## How to create a subplugin

Lets learn by example, the following section will create a subplugin which will fetch the \[viewer] or a given user from his \[login] and add it to the Gatsby GraphQL Data Layer.

### Defining your plugin options

Most plugins use options to customize their behavior, in our case we need to know the login, even though not required.

1. In your Gatsby project, create the plugin folder _plugins/gatsby-source-github-graphql-get-user_.

2. From now, we'll be working inside this folder.

3. Create a file called `gatsby-node.js`.

4. In this file lets specify which options we're expecting, in our case: the user \[login] which is not required since if it's omitted we will fetch the \[viewer] user (Gatsby uses [Joi](https://joi.dev/api/?v=17.6.1) for schema validation).

```js
// plugins/gatsby-source-github-graphql-get-user/index.js

// Equivalent to [sourceNodes] gatsby API.
module.exports.sourceNodes = async (gatsbyNodeApis, pluginOptions) => {
  // The [login] option we specified earlier in the [gatsby-node.js] file.
  // Remember we did not marked as required so it can be null or undefined.
  const { login } = pluginOptions;

  // [githubSourcePlugin] was inserted by the core plugin and here lives all non-official (those provided by the core plugin not Gatsby) APIs.
  const { githubSourcePlugin } = gatsbyNodeApis;

  // This [graphql] is from ocktokit/graphql.js package.
  // Even though is not possible to access the token directly,
  // you can make authenticated requests using this graphql client.
  // The authenticated user is defined in the [pluginOptions.token] or [yourSubpluginOptions.token].
  const { graphql } = githubSourcePlugin;

  // Did not found an way to share fragments across subplugins to avoid repetition and lack of data so I did raw strings.
  // This is safe to insert in the query since it is package defined and has no user input.
  // You can use it or not. If you think it's not required (e.g you are fetching repositories of a user, you don't care about the user data itself) then just skip it for the user resolver.
  const { githubPlainResolverFields } = githubSourcePlugin;

  // Always use this variable to define types.
  // Otherwise we will not be able to customize the types if a conflict between plugins node types happens.
  const { pluginNodeTypes } = githubSourcePlugin;

  const userQuery = `
    query GetUser($login: String!) {
      user(login: $login) {
        ${githubPlainResolverFields.USER}
      }
    }
  `;

  const viewerQuery = `
    query GetViewer {
      viewer {
        ${githubPlainResolverFields.USER}
      }
    }
  `;

  // Wether or not we should fetch a user by its [login] option.
  const isCustomUser = typeof login === `string`;

  // If there's a custom user, fetch through user query otherwise use the viewer query.
  const query = isCustomUser ? userQuery : viewerQuery;

  // Same logic for the variables: custom user requires its [login]
  // But the [viewer] is resolved in the GitHub server through the provided token, so don't need variables.
  const variables = isCustomUser ? { login: login } : {};

  // You can also add a query alias for [viewer] or [user] query.
  // But for simplicity lets extract both keys take the not-null one.
  const { user: customUser, viewer: viewerUser } = await graphql(
    query,
    variables
  );
  const user = customUser ?? viewerUser;

  return {
    // Always define the key as data type and the value as an array of the data.
    [pluginNodeTypes.USER]: [user],
  };
};

// The user avatarURL is optimized by default in the core plugin since it's a intrinsic use-case and it's available under the 'avatarUrlSharpOptimized' key.
// But just for 'fun' lets create a custom key in the user node type to store a second optimized image URL (just for example purposes).
module.exports.onCreateNode = async (
  { node, githubSourcePlugin },
  pluginOptions
) => {
  // [createFileNodeFrom] is new here and it's available only inside of [onCreateNode] function.
  // This function actually calls [createRemoteFileNode] from [gatsby-source-filesystem] and links to
  // its parent node, in this case our custom user, it's basically a helper function for image optimization.
  const { pluginNodeTypes, createFileNodeFrom } = githubSourcePlugin;

  if (node.internal.type === pluginNodeTypes.USER) {
    if (`avatarUrl` in node) {
      await createFileNodeFrom({
        node,
        // Must be the key which stores the actually remote image URL, it's returned by the GitHub API.
        key: `avatarUrl`,
        // Important: this [fieldName] defines the key that our image will
        // be stored inside of the Gatsby reserved [fields] key.
        fieldName: `optimizedAvatarField`,
      });
    }
  }
};

module.exports.createSchemaCustomization = (
  { actions: { createTypes }, githubSourcePlugin },
  pluginOptions
) => {
  const { pluginNodeTypes } = githubSourcePlugin;

  // Now lets define that the User type will have the key
  // [optimizedAvatar] that should be linked from the previously created field [optimizedAvatarField].
  const userWithOptimizedAvatarTypeDef = `
    type ${pluginNodeTypes.USER} implements Node {
      optimizedAvatar: File @link(from: "fields.optimizedAvatarField")
    }
  `;

  // Now call the API to actually create it.
  createTypes(userWithOptimizedAvatarTypeDef);
};
```

5. Create an empty `package.json` with the following contents or just run `npm init -y` or `yarn init -y`:

```js
{
  "name": "gatsby-source-github-graphql-get-user",
  "version": "0.1.0",
  "main": "index.js",
  "license": "MIT"
}
```

6. Almost ready, lets move your working directory to your actual Gatsby project (not the plugins folder).
  - Remember: when you're using a plugin not from your _plugins/*_ folder you need to install it before (through npm or through directly git installations, see [installation section](#installation) for details).

7. Import your plugin inside the core plugin in your `gatsby-config.js`.

```js
// gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-github-graphql`,
      options: {
        token: process.env.GITHUB_TOKEN, // Do not forget to provide your token through the .env variable.
        plugins: [
          {
            resolve: `gatsby-source-github-graphql-get-user`,
            options: {
              // The option you marked as optional, lets provide it:
              login: `<your-github-username>` // Remember to try it without this option to see it working through the provided [token]!
            }
          }
        ]
      }
    },
  ]
};
```

8. Run `gatsby develop`.

9. Open your browser at `http://localhost:8000/___graphql` (or the URL your configured for Gatsby development server).

10. Run the following query:

```graphql
query GetMyUser {
  # Regex because sometimes the username case can differ from the registered in the database.
  githubUser(login: { regex: "/<your-username-you-defined-at-gatsby-config>/i" }) {
    login
    name
    # The field you created through the plugin!
    optimizedAvatar
  }
}
```

A prinscreen of what it should looks like:

<img src="https://user-images.githubusercontent.com/51419598/196519795-2041eeb3-5d1b-438a-9012-720a6f71d24c.png">

11. Now keep hacking and use it to build your website/blog.
