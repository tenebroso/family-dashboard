export const typeDefs = `#graphql
  type Query {
    ping: String
  }
`

export const resolvers = {
  Query: {
    ping: () => 'pong',
  },
}
