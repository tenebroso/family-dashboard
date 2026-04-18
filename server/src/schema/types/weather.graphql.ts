export const weatherTypeDefs = `#graphql
  type WeatherDay {
    date: String!
    tempHigh: Float!
    tempLow: Float!
    conditionCode: Int!
    conditionLabel: String!
    precipitation: Float!
  }

  type CurrentWeather {
    temp: Float!
    feelsLike: Float!
    conditionCode: Int!
    conditionLabel: String!
    humidity: Int!
  }

  type WeatherData {
    current: CurrentWeather!
    forecast: [WeatherDay!]!
  }
`
