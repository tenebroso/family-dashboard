module.exports = {
  apps: [{
    name: 'family-dashboard',
    script: './server/dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
    },
    watch: false,
    autorestart: true,
    max_memory_restart: '400M',
  }],
}
