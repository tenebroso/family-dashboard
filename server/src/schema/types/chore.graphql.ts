export const choreTypeDefs = `#graphql
  type Chore {
    id: ID!
    title: String!
    person: Person!
    dayOfWeek: [Int!]!
    isActive: Boolean!
    isCompletedOn(dateKey: String!): Boolean!
  }

  type ChoreCompletion {
    id: ID!
    choreId: String!
    dateKey: String!
    completedAt: String!
  }

  input CreateChoreInput {
    title: String!
    personId: String!
    dayOfWeek: [Int!]!
  }

  input UpdateChoreInput {
    id: ID!
    title: String
    dayOfWeek: [Int!]
    isActive: Boolean
  }
`
