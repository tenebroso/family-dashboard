import { Request, Response, NextFunction } from 'express'
import { AuthUser } from '../auth'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthenticated' })
  }
  const user = req.user as AuthUser
  if (!user.linked) {
    return res.status(403).json({ error: 'Account not linked to a family member' })
  }
  next()
}
