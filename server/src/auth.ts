import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type AuthUser =
  | { linked: true; personId: string }
  | { linked: false; googleId: string; email: string }

if (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        callbackURL: `${process.env.APP_URL}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id
          const email = profile.emails?.[0]?.value ?? ''

          const person = await prisma.person.findUnique({ where: { googleId } })
          if (person) {
            return done(null, { linked: true, personId: person.id } satisfies AuthUser)
          }

          return done(null, { linked: false, googleId, email } satisfies AuthUser)
        } catch (err) {
          done(err as Error)
        }
      }
    )
  )
}

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user as AuthUser))

export default passport
