import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { useAerial } from '../contexts/AerialContext'
import Skeleton from './Skeleton'

const GROCERY_ITEMS_QUERY = gql`
  query GroceryItemsDashboard {
    groceryItems {
      id
      name
      quantity
      checked
    }
  }
`

type GroceryItem = {
  id: string
  name: string
  quantity: string | null
  checked: boolean
}

export default function GroceryWidget() {
  const aerial = useAerial()
  const { data, loading } = useQuery<{ groceryItems: GroceryItem[] }>(GROCERY_ITEMS_QUERY)

  const cardClass = aerial
    ? 'backdrop-blur-md bg-black/50 rounded-lg ring-1 ring-white/10 p-4'
    : 'bg-surface-raised rounded-lg p-4'

  if (loading) {
    return (
      <div className={cardClass}>
        <p className="text-xs uppercase tracking-widest text-gold mb-3">Grocery List</p>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  const unchecked = (data?.groceryItems ?? []).filter((i) => !i.checked)
  const visible = unchecked.slice(0, 5)
  const overflow = unchecked.length - visible.length

  return (
    <div className={cardClass}>
      <p className="text-xs uppercase tracking-widest text-gold mb-3">Grocery List</p>

      {unchecked.length === 0 ? (
        <p className="text-sm text-ink-muted">List is empty.</p>
      ) : (
        <ul className="space-y-1.5">
          {visible.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm text-ink">
              <span className="w-1 h-1 rounded-full bg-gold/60 flex-shrink-0" />
              <span className="truncate">
                {item.name}
                {item.quantity && (
                  <span className="text-ink-muted ml-1.5">· {item.quantity}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        {overflow > 0 ? (
          <a href="/grocery-admin" className="text-xs text-ink-muted hover:text-ink transition-colors">
            +{overflow} more
          </a>
        ) : (
          <span />
        )}
        <a href="/grocery-admin" className="text-xs text-gold hover:text-gold-light transition-colors">
          Add item →
        </a>
      </div>
    </div>
  )
}
