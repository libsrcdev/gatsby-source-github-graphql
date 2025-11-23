# gatsby-source-github-graphql-user-repos

Gatsby sub-plugin of `@libsrcdev/gatsby-source-github-graphql` that fetches the repositories of a given user/org. The currently available option is to target the user/org through `login` key and also support repository filters, see `gatsby-node.js` for full option details.

This repository doesn't fetch recursively and the target users must be explicitly specified.

See the example app under `/examples` for usage details.
