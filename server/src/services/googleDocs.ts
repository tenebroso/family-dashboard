import { google } from 'googleapis'

const DOC_TITLE = 'Family Grocery List'

function createClients() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  return {
    docs: google.docs({ version: 'v1', auth: oauth2Client }),
    drive: google.drive({ version: 'v3', auth: oauth2Client }),
  }
}

let cachedDocId: string | null = process.env.GOOGLE_DOCS_GROCERY_ID || null

async function getOrCreateDoc(): Promise<string> {
  if (cachedDocId) return cachedDocId

  const { drive, docs } = createClients()

  const search = await drive.files.list({
    q: `name='${DOC_TITLE}' and mimeType='application/vnd.google-apps.document' and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  })

  if (search.data.files?.length) {
    cachedDocId = search.data.files[0].id!
    console.log(`[googleDocs] Found grocery doc: ${cachedDocId}`)
    return cachedDocId
  }

  const created = await docs.documents.create({ requestBody: { title: DOC_TITLE } })
  cachedDocId = created.data.documentId!
  console.log(`[googleDocs] Created grocery doc: ${cachedDocId}`)
  console.log(`[googleDocs] Add to server/.env: GOOGLE_DOCS_GROCERY_ID=${cachedDocId}`)
  return cachedDocId
}

interface GroceryItem {
  name: string
  quantity?: string | null
  category?: string | null
  checked: boolean
}

export async function syncGroceryList(items: GroceryItem[]): Promise<void> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) return

  try {
    const docId = await getOrCreateDoc()
    const { docs } = createClients()

    const doc = await docs.documents.get({ documentId: docId })
    const endIndex = doc.data.body?.content?.at(-1)?.endIndex ?? 1

    const unchecked = items.filter(i => !i.checked)
    const checked = items.filter(i => i.checked)
    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const lines: string[] = [`Family Grocery List`, `Updated: ${now}`, '']

    const byCategory = new Map<string, GroceryItem[]>()
    for (const item of unchecked) {
      const cat = item.category || 'General'
      if (!byCategory.has(cat)) byCategory.set(cat, [])
      byCategory.get(cat)!.push(item)
    }

    for (const [cat, catItems] of byCategory) {
      lines.push(`[ ${cat} ]`)
      for (const item of catItems) {
        lines.push(`  • ${item.name}${item.quantity ? ` — ${item.quantity}` : ''}`)
      }
      lines.push('')
    }

    if (unchecked.length === 0) {
      lines.push('  (no items)')
      lines.push('')
    }

    if (checked.length > 0) {
      lines.push(`--- In cart (${checked.length}) ---`)
      for (const item of checked) {
        lines.push(`  ✓ ${item.name}`)
      }
    }

    const content = lines.join('\n')

    const requests: object[] = []
    if (endIndex > 2) {
      requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: endIndex - 1 } } })
    }
    requests.push({ insertText: { location: { index: 1 }, text: content } })

    await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests } })
  } catch (err) {
    console.error('[googleDocs] Failed to sync grocery list:', err)
  }
}
