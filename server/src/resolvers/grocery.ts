import { PrismaClient, GroceryItem } from '@prisma/client'
import { syncGroceryList } from '../services/googleDocs'

const prisma = new PrismaClient()

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null

function syncAfterMutation() {
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer)
  syncDebounceTimer = setTimeout(async () => {
    syncDebounceTimer = null
    const items = await prisma.groceryItem.findMany({
      orderBy: [{ checked: 'asc' }, { createdAt: 'asc' }],
    })
    syncGroceryList(items).catch(() => {})
  }, 500)
}

export const groceryResolvers = {
  Query: {
    groceryItems: async () => {
      const items = await prisma.groceryItem.findMany({
        orderBy: [{ checked: 'asc' }, { createdAt: 'asc' }],
      })
      return items.map((item: GroceryItem) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))
    },
  },

  Mutation: {
    addGroceryItem: async (
      _: unknown,
      args: { name: string; quantity?: string; category?: string; addedBy: string }
    ) => {
      const item = await prisma.groceryItem.create({ data: args })
      syncAfterMutation()
      return { ...item, createdAt: item.createdAt.toISOString() }
    },

    toggleGroceryItem: async (_: unknown, { id }: { id: string }) => {
      const item = await prisma.groceryItem.findUniqueOrThrow({ where: { id } })
      const updated = await prisma.groceryItem.update({
        where: { id },
        data: { checked: !item.checked },
      })
      syncAfterMutation()
      return { ...updated, createdAt: updated.createdAt.toISOString() }
    },

    deleteGroceryItem: async (_: unknown, { id }: { id: string }) => {
      await prisma.groceryItem.delete({ where: { id } })
      syncAfterMutation()
      return true
    },

    clearCheckedGroceryItems: async () => {
      const result = await prisma.groceryItem.deleteMany({ where: { checked: true } })
      syncAfterMutation()
      return result.count
    },
  },
}
