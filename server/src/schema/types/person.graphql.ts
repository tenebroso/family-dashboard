export const personTypeDefs = `#graphql
  type Person {
    id: ID!
    name: String!
    color: String!
    chores(dayOfWeek: Int, dateKey: String): [Chore!]!
    completionRate(dateKey: String!): Float!
    reminders: [Reminder!]!
  }
`
