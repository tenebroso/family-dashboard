export const messageTypeDefs = `#graphql
  type Message {
    id: ID!
    personSlug: String!
    body: String!
    parsedType: String
    parsedDone: Boolean!
    createdAt: String!
  }
`
