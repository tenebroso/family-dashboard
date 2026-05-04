import { execSync } from 'child_process'
import path from 'path'

export default async function globalSetup() {
  const rootDir = path.join(__dirname, '..')
  console.log('\n[global-setup] Seeding test workout data…')
  execSync('npx ts-node server/src/scripts/seedTestWorkouts.ts', {
    cwd: rootDir,
    stdio: 'inherit',
  })
  console.log('[global-setup] Done.\n')
}
