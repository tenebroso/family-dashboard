import { useState, useMemo } from 'react'
import { gql } from '@apollo/client'
import { useQuery, useMutation } from '@apollo/client/react'

const GROCERY_ITEMS_QUERY = gql`
  query GroceryItems {
    groceryItems {
      id
      name
      quantity
      category
      addedBy
      checked
      createdAt
    }
  }
`

const ADD_GROCERY_ITEM = gql`
  mutation AddGroceryItem($name: String!, $quantity: String, $category: String, $addedBy: String!) {
    addGroceryItem(name: $name, quantity: $quantity, category: $category, addedBy: $addedBy) {
      id
      name
      quantity
      category
      addedBy
      checked
      createdAt
    }
  }
`

const TOGGLE_GROCERY_ITEM = gql`
  mutation ToggleGroceryItem($id: ID!) {
    toggleGroceryItem(id: $id) {
      id
      checked
    }
  }
`

const DELETE_GROCERY_ITEM = gql`
  mutation DeleteGroceryItem($id: ID!) {
    deleteGroceryItem(id: $id)
  }
`

const CLEAR_CHECKED = gql`
  mutation ClearCheckedGroceryItems {
    clearCheckedGroceryItems
  }
`

type GroceryItem = {
  id: string
  name: string
  quantity: string | null
  category: string | null
  addedBy: string
  checked: boolean
  createdAt: string
}

export default function GroceryAdminPage() {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState('')
  const [addedBy, setAddedBy] = useState('')

  const { data, loading } = useQuery<{ groceryItems: GroceryItem[] }>(GROCERY_ITEMS_QUERY)
  const items = data?.groceryItems ?? []

  const [addItem, { loading: adding }] = useMutation(ADD_GROCERY_ITEM, {
    refetchQueries: ['GroceryItems'],
    onCompleted: () => {
      setName('')
      setQuantity('')
      setCategory('')
    },
  })

  const [toggleItem] = useMutation(TOGGLE_GROCERY_ITEM, {
    refetchQueries: ['GroceryItems'],
  })

  const [deleteItem] = useMutation(DELETE_GROCERY_ITEM, {
    refetchQueries: ['GroceryItems'],
  })

  const [clearChecked, { loading: clearing }] = useMutation(CLEAR_CHECKED, {
    refetchQueries: ['GroceryItems'],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !addedBy.trim()) return
    addItem({
      variables: {
        name: name.trim(),
        quantity: quantity.trim() || undefined,
        category: category.trim() || undefined,
        addedBy: addedBy.trim(),
      },
    })
  }

  const grouped = useMemo(() => {
    const unchecked = items.filter((i) => !i.checked)
    const checked = items.filter((i) => i.checked)
    const byCategory: Record<string, GroceryItem[]> = {}
    for (const item of unchecked) {
      const key = item.category ?? 'Other'
      if (!byCategory[key]) byCategory[key] = []
      byCategory[key].push(item)
    }
    return { byCategory, checked }
  }, [items])

  const exportList = () => {
    const unchecked = items.filter((i) => !i.checked)
    const byCategory: Record<string, GroceryItem[]> = {}
    for (const item of unchecked) {
      const key = item.category ?? 'Other'
      if (!byCategory[key]) byCategory[key] = []
      byCategory[key].push(item)
    }
    const lines: string[] = []
    for (const [cat, catItems] of Object.entries(byCategory)) {
      lines.push(`${cat}:`)
      for (const item of catItems) {
        lines.push(`  - ${item.name}${item.quantity ? ` (${item.quantity})` : ''}`)
      }
      lines.push('')
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grocery-list.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const checkedCount = grouped.checked.length

  return (
    <div className="max-w-2xl mx-auto p-6 pt-8">
      <div className="flex justify-end mb-4">
        <a href="/" className="text-xs text-ink-muted hover:text-ink transition-colors">← Home</a>
      </div>
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Grocery List</h1>
      <p className="text-sm text-ink-muted mb-8">Add items for the next shopping trip.</p>

      {/* Add item form */}
      <form onSubmit={handleSubmit} className="bg-surface-raised rounded-lg p-4 mb-6 space-y-3">
        <p className="text-xs uppercase tracking-widest text-gold mb-1">Add Item</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name *"
            className="col-span-2 bg-surface rounded-lg px-3 py-2.5 text-ink text-sm placeholder:text-ink-muted outline-none focus:ring-1 focus:ring-gold/40"
            required
          />
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity (e.g. 2 lbs)"
            className="bg-surface rounded-lg px-3 py-2.5 text-ink text-sm placeholder:text-ink-muted outline-none focus:ring-1 focus:ring-gold/40"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g. Produce)"
            className="bg-surface rounded-lg px-3 py-2.5 text-ink text-sm placeholder:text-ink-muted outline-none focus:ring-1 focus:ring-gold/40"
          />
          <input
            type="text"
            value={addedBy}
            onChange={(e) => setAddedBy(e.target.value)}
            placeholder="Added by *"
            className="bg-surface rounded-lg px-3 py-2.5 text-ink text-sm placeholder:text-ink-muted outline-none focus:ring-1 focus:ring-gold/40"
            required
          />
          <button
            type="submit"
            disabled={adding || !name.trim() || !addedBy.trim()}
            className="bg-gold text-surface font-semibold rounded-lg text-sm py-2.5 disabled:opacity-40 transition-opacity"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>

      {/* Actions row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-ink-muted">{items.length} items total</span>
        <div className="flex gap-3">
          <button
            onClick={exportList}
            className="text-xs text-ink-muted hover:text-ink border border-white/10 rounded px-3 py-1.5 transition-colors"
          >
            Export list
          </button>
          {checkedCount > 0 && (
            <button
              onClick={() => clearChecked()}
              disabled={clearing}
              className="text-xs text-ink-muted hover:text-ink border border-white/10 rounded px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              Clear checked ({checkedCount})
            </button>
          )}
        </div>
      </div>

      {/* Item list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-shimmer h-10 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-muted py-8 text-center">List is empty. Add your first item above.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped.byCategory).map(([cat, catItems]) => (
            <div key={cat}>
              <p className="text-xs uppercase tracking-widest text-gold mb-2">{cat}</p>
              <div className="space-y-1">
                {catItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleItem({ variables: { id: item.id } })}
                    onDelete={() => deleteItem({ variables: { id: item.id } })}
                  />
                ))}
              </div>
            </div>
          ))}

          {grouped.checked.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-muted mb-2">Checked</p>
              <div className="space-y-1">
                {grouped.checked.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={() => toggleItem({ variables: { id: item.id } })}
                    onDelete={() => deleteItem({ variables: { id: item.id } })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ItemRow({
  item,
  onToggle,
  onDelete,
}: {
  item: GroceryItem
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div className={`flex items-center gap-3 bg-surface-raised rounded-lg px-3 py-2.5 ${item.checked ? 'opacity-50' : ''}`}>
      <button
        onClick={onToggle}
        className="w-5 h-5 flex-shrink-0 rounded border border-white/20 flex items-center justify-center hover:border-gold/60 transition-colors"
        aria-label={item.checked ? 'Uncheck item' : 'Check item'}
      >
        {item.checked && (
          <svg className="w-3 h-3 text-gold" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`text-sm text-ink ${item.checked ? 'line-through text-ink-muted' : ''}`}>
          {item.name}
          {item.quantity && <span className="text-ink-muted ml-1.5">· {item.quantity}</span>}
        </span>
        <span className="text-xs text-ink-muted ml-2">— {item.addedBy}</span>
      </div>
      <button
        onClick={onDelete}
        className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-ink-muted hover:text-ink transition-colors rounded"
        aria-label="Delete item"
      >
        ×
      </button>
    </div>
  )
}
