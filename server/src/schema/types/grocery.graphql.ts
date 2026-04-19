export const groceryTypeDefs = `#graphql
  type GroceryItem {
    id: ID!
    name: String!
    quantity: String
    category: String
    addedBy: String!
    checked: Boolean!
    createdAt: String!
  }
`
