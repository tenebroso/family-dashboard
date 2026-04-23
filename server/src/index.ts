import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import path from 'path'
dotenv.config({ path: path.join(__dirname, '..', '.env') })
import { typeDefs } from './schema'
import { resolvers } from './resolvers'
import { ensureTodaysAerial, getTodaysAerialPath } from './services/aerial'
import { startCronJobs } from './cron'

async function main() {
  const app = express()
  const port = parseInt(process.env.PORT ?? '4000', 10)

  app.use(express.json())

  app.use('/music', express.static(path.join(__dirname, '..', 'assets', 'music')))

  app.get('/api/aerial', (req, res) => {
    const p = getTodaysAerialPath()
    if (p) {
      res.sendFile(p)
    } else {
      res.status(204).end()
    }
  })

  const apollo = new ApolloServer({ typeDefs, resolvers })
  await apollo.start()
  app.use('/graphql', cors(), expressMiddleware(apollo))

  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(__dirname, '..', '..', 'client', 'dist')
    app.use(express.static(clientDist))
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'))
    })
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server ready at http://0.0.0.0:${port}/graphql`)
  })

  // Fire-and-forget: fetch today's aerial in the background
  ensureTodaysAerial().catch(console.error)
  startCronJobs()
}

main().catch(console.error)
