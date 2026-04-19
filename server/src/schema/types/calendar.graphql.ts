export const calendarTypeDefs = `#graphql
  type CalendarEvent {
    id: ID!
    title: String!
    start: String!
    end: String!
    allDay: Boolean!
    description: String
    color: String
    personSlug: String
  }
`
