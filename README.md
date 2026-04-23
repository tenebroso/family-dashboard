# Family Dashboard

A full-screen family dashboard running on a Raspberry Pi 5, accessible from any device on the home network. Shows chores, calendar events, weather, word of the day, a music player, and custom messages.

**Stack:** React + TypeScript + Vite · Node.js + Express + Apollo GraphQL · Prisma + SQLite · Playwright

## Dev setup

```bash
npm ci                # install all workspace dependencies

# Terminal 1
cd server && npm run dev   # GraphQL API at http://localhost:4000

# Terminal 2
cd client && npm run dev   # UI at http://localhost:5173
```

## Raspberry Pi Deployment

### One-time Pi setup

```bash
# 1. Install Node 20 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20 && nvm use 20

# 2. Install PM2 globally
npm install -g pm2

# 3. Install ffmpeg (for aerial background images)
sudo apt install -y ffmpeg

# 4. Clone the repo
git clone <repo-url> ~/family-dashboard
cd ~/family-dashboard
```

### Configure environment

Copy `server/.env.example` to `server/.env` and fill in all values:

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=
APPLE_ID=
APPLE_APP_PASSWORD=
OPEN_METEO_LAT=43.0389
OPEN_METEO_LNG=-87.9065
PORT=4000
NODE_ENV=production
```

### Install, build, and seed

```bash
cd ~/family-dashboard
npm ci
cd server && npx prisma generate && npx prisma migrate deploy
npm run seed         # first install only — wipes existing data
cd ..
npm run build
```

### Place music files

Copy your MP3s into `server/assets/music/` then import them:

```bash
cd server && npm run importTracks
```

### Start with PM2

```bash
cd ~/family-dashboard
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # run the command it prints as sudo to auto-start on boot
```

The app is now accessible at `http://<pi-ip>:4000` from any device on the network.

### Static IP + dashboard.local

**Set a static IP on the Pi:**

Edit `/etc/dhcpcd.conf` and add at the bottom (adjust interface and IP to match your network):

```
interface eth0          # or wlan0 if using Wi-Fi
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

Restart networking: `sudo systemctl restart dhcpcd`

**Add dashboard.local to your router's DNS (recommended):**

In your router's admin panel, add a local DNS entry:
- Hostname: `dashboard`
- Domain: `local` (or your local domain)
- IP: `192.168.1.100` (your Pi's static IP)

The app is then reachable at `http://dashboard.local:4000` from any device on the network.

**Optionally serve on port 80** (no port in URL) using authbind:

```bash
sudo apt install authbind
sudo touch /etc/authbind/byport/80
sudo chown pi /etc/authbind/byport/80
sudo chmod 500 /etc/authbind/byport/80
```

Then change `PORT=80` in `server/.env` and restart PM2.

### Useful PM2 commands

```bash
pm2 status              # check process health
pm2 logs family-dashboard  # stream logs
pm2 restart family-dashboard
pm2 stop family-dashboard
```

### Updating the app

```bash
cd ~/family-dashboard
git pull
npm ci
cd server && npx prisma migrate deploy && cd ..
npm run build
pm2 restart family-dashboard
```

## See CLAUDE.md for architecture details and all commands.
