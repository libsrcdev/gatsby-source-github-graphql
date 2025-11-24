const { graphql } = require("@octokit/graphql")

function createGraphQLWithAuth(token) {
  if (typeof token !== `string`) return graphql

  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  })

  return graphqlWithAuth
}

// Use closures to avoid sharing the token directly through the subplugins.
function createSafeGraphQL(token) {
  const graphqlWithAuth = createGraphQLWithAuth(token)

  // Now we can call [safeGraphQL] and pass the
  // query and variables without the need to explicity setting the token.
  const safeGraphQL = (...args) => graphqlWithAuth(...args)

  return safeGraphQL
}

exports.createGraphQLWithAuth = createGraphQLWithAuth
exports.createSafeGraphQL = createSafeGraphQL
