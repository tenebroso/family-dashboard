export const reminderTypeDefs = `#graphql
  type Reminder {
    id: ID!
    personId: String!
    text: String!
    dueDate: String
    done: Boolean!
    createdAt: String!
  }
`
