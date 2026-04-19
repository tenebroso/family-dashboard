import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\(\w/g, m => m.toUpperCase())
}

function parseMusicFilename(filename: string): { title: string; artist: string } {
  let name = filename.replace(/\.mp3$/i, '')
  name = name.replace(/-marr$/, '')
  name = name.replace(/^\d+-/, '')

  const firstHyphen = name.indexOf('-')
  if (firstHyphen === -1) {
    return { artist: 'Unknown', title: toTitleCase(name) }
  }

  const artistRaw = name.substring(0, firstHyphen)
  const titleRaw = name.substring(firstHyphen + 1)

  return {
    artist: toTitleCase(artistRaw),
    title: toTitleCase(titleRaw),
  }
}

async function main() {
  const musicDir = path.join(__dirname, '..', '..', 'assets', 'music')

  if (!fs.existsSync(musicDir)) {
    console.log(`Music directory not found: ${musicDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(musicDir).filter(f => f.toLowerCase().endsWith('.mp3'))

  let imported = 0
  let skipped = 0

  for (const filename of files) {
    const existing = await prisma.track.findUnique({ where: { filename } })
    if (existing) {
      skipped++
      continue
    }

    const { title, artist } = parseMusicFilename(filename)
    await prisma.track.create({ data: { title, artist, filename } })
    console.log(`  Imported: ${artist} — ${title}`)
    imported++
  }

  console.log(`\nDone. ${imported} imported, ${skipped} already existed.`)
  await prisma.$disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
