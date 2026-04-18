import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import path from 'path'
import { typeDefs } from './schema'
import { resolvers } from './resolvers'

async function main() {
  const app = express()
  const port = parseInt(process.env.PORT ?? '4000', 10)

  app.use(cors())
  app.use(express.json())

  app.use('/music', express.static(path.join(__dirname, '..', 'assets', 'music')))

  const apollo = new ApolloServer({ typeDefs, resolvers })
  await apollo.start()
  app.use('/graphql', expressMiddleware(apollo))

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server ready at http://0.0.0.0:${port}/graphql`)
  })
}

main().catch(console.error)
