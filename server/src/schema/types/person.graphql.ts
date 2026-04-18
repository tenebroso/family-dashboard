export const personTypeDefs = `#graphql
  type Person {
    id: ID!
    name: String!
    color: String!
    chores(dayOfWeek: Int): [Chore!]!
    completionRate(dateKey: String!): Float!
  }
`
