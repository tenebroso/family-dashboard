import 'dotenv/config'
import { google } from 'googleapis'
import * as http from 'http'

const REDIRECT_URI = 'http://localhost:3000/callback'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI,
)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // forces Google to return a new refresh_token
  scope: ['https://www.googleapis.com/auth/calendar.readonly'],
})

console.log('\n=== Google OAuth Token Generator ===\n')
console.log('STEP 1 — Add this redirect URI to your Google Cloud OAuth client:')
console.log(`  ${REDIRECT_URI}\n`)
console.log('STEP 2 — Open this URL in your browser:\n')
console.log(authUrl)
console.log('\nWaiting for Google to redirect to localhost:3000 ...\n')

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:3000`)
  if (url.pathname !== '/callback') {
    res.writeHead(404)
    res.end()
    return
  }

  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !code) {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end('<h2>Authorization failed.</h2><p>Check the terminal for details.</p>')
    console.error('OAuth error:', error)
    server.close()
    process.exit(1)
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end('<h2>Success!</h2><p>You can close this tab. Check the terminal for your token.</p>')

    console.log('\n=== SUCCESS ===\n')
    console.log('Add this line to server/.env:\n')
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`)
    console.log()
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' })
    res.end('<h2>Token exchange failed.</h2><p>Check the terminal.</p>')
    console.error('Token exchange failed:', err)
  } finally {
    server.close()
    process.exit(0)
  }
})

server.listen(3000)
