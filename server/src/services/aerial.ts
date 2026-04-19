import fs from 'fs'
import path from 'path'
import https from 'https'
import type { IncomingMessage } from 'http'

const BING_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US'
const BING_BASE = 'https://www.bing.com'
const CACHE_DIR = path.join(__dirname, '..', '..', 'cache')

let todaysPath: string | null = null

function dateKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
}

function cachePath(dk: string): string {
  return path.join(CACHE_DIR, `aerial-${dk}.jpg`)
}

function httpsGet(url: string): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : BING_BASE + res.headers.location
        httpsGet(next).then(resolve).catch(reject)
        return
      }
      resolve(res)
    }).on('error', reject)
  })
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await httpsGet(url)
  return new Promise((resolve, reject) => {
    let body = ''
    res.on('data', (c: Buffer) => (body += c.toString()))
    res.on('end', () => { try { resolve(JSON.parse(body)) } catch (e) { reject(e) } })
    res.on('error', reject)
  })
}

async function downloadToFile(url: string, outputPath: string): Promise<void> {
  const res = await httpsGet(url)
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath)
    res.pipe(file)
    file.on('finish', () => file.close(() => resolve()))
    file.on('error', (e) => { fs.unlink(outputPath, () => {}); reject(e) })
    res.on('error', reject)
  })
}

export async function ensureTodaysAerial(): Promise<string | null> {
  const dk = dateKey()
  const out = cachePath(dk)

  if (fs.existsSync(out)) {
    todaysPath = out
    return out
  }

  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

    const data = await fetchJson(BING_API) as { images: Array<{ url: string }> }
    const imgPath = data.images?.[0]?.url
    if (!imgPath) throw new Error('No image in Bing response')

    const imgUrl = imgPath.startsWith('http') ? imgPath : BING_BASE + imgPath
    await downloadToFile(imgUrl, out)

    todaysPath = out
    console.log(`[aerial] Cached today's background: ${out}`)
    return out
  } catch (err) {
    console.error('[aerial] Failed to fetch background image:', err)
    return null
  }
}

export function getTodaysAerialPath(): string | null {
  return todaysPath
}

export async function forceRefreshAerial(): Promise<void> {
  const dk = dateKey()
  const out = cachePath(dk)
  if (fs.existsSync(out)) fs.unlinkSync(out)
  todaysPath = null
  await ensureTodaysAerial()
  console.log('[aerial] Force-refreshed for', dk)
}
