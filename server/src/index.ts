import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const connectSqlite3 = require('connect-sqlite3')
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import path from 'path'
import { PrismaClient } from '@prisma/client'
dotenv.config({ path: path.join(__dirname, '..', '.env') })
import passport from './auth'
import { AuthUser } from './auth'
import { requireAuth } from './middleware/requireAuth'
import { typeDefs } from './schema'
import { resolvers } from './resolvers'
import { ensureTodaysAerial, getTodaysAerialPath } from './services/aerial'
import { startCronJobs } from './cron'

const prisma = new PrismaClient()
const SQLiteStore = connectSqlite3(session) as unknown as new (options: { db?: string; dir?: string; table?: string }) => session.Store

async function main() {
  const app = express()
  const port = parseInt(process.env.PORT ?? '4000', 10)

  app.set('trust proxy', 1)
  app.use(express.json())

  app.use(
    session({
      store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, '..') }),
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    }) as any
  )

  app.use(passport.initialize() as any)
  app.use(passport.session() as any)

  // Auth routes (unprotected)
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/google' }),
    (req, res) => {
      const user = req.user as AuthUser
      if (!user.linked && process.env.ALLOW_NEW_LINKS !== 'true') {
        req.logout(() => res.redirect('/?error=access_denied'))
        return
      }
      req.session.save(() => {
        res.redirect(user.linked ? '/' : '/link-account')
      })
    }
  )

  app.get('/auth/logout', (req, res) => {
    req.logout(() => res.redirect('/'))
  })

  app.get('/auth/me', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthenticated' })
    const user = req.user as AuthUser
    if (!user.linked) return res.status(403).json({ error: 'Not linked', linked: false })
    const person = await prisma.person.findUnique({
      where: { id: user.personId },
      select: { id: true, name: true, color: true },
    })
    if (!person) return res.status(404).json({ error: 'Person not found' })
    res.json({ person })
  })

  app.get('/auth/link-status', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthenticated' })
    const user = req.user as AuthUser
    if (user.linked) return res.json({ linked: true })
    const people = await prisma.person.findMany({
      select: { id: true, name: true, color: true },
      orderBy: { name: 'asc' },
    })
    res.json({ linked: false, googleEmail: user.email, people })
  })

  app.post('/auth/link-account', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthenticated' })
    const user = req.user as AuthUser
    if (user.linked) return res.json({ linked: true })

    const { personId } = req.body as { personId: string }
    if (!personId) return res.status(400).json({ error: 'personId required' })

    try {
      await prisma.person.update({
        where: { id: personId },
        data: { googleId: user.googleId, email: user.email },
      })
      const linked: AuthUser = { linked: true, personId }
      req.login(linked, (err) => {
        if (err) return res.status(500).json({ error: 'Session update failed' })
        res.json({ linked: true, personId })
      })
    } catch (err) {
      res.status(500).json({ error: 'Failed to link account' })
    }
  })

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

  app.use(
    '/graphql',
    requireAuth,
    cors(),
    expressMiddleware(apollo, {
      context: async ({ req }) => {
        const user = req.user as AuthUser | undefined
        if (!user?.linked) return { person: null }
        const person = await prisma.person.findUnique({ where: { id: user.personId } })
        return { person }
      },
    })
  )

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

  ensureTodaysAerial().catch(console.error)
  startCronJobs()
}

main().catch(console.error)
