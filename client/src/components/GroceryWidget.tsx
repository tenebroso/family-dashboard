import { gql } from '@apollo/client'
import { useQuery, useMutation } from '@apollo/client/react'

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

const TOGGLE_GROCERY = gql`
  mutation ToggleGroceryItem($id: ID!) {
    toggleGroceryItem(id: $id) {
      id
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
  const { data, loading } = useQuery<{ groceryItems: GroceryItem[] }>(GROCERY_ITEMS_QUERY, {
    pollInterval: 30_000,
  })
  const [toggle] = useMutation(TOGGLE_GROCERY, {
    refetchQueries: [{ query: GROCERY_ITEMS_QUERY }],
  })

  const items = data?.groceryItems ?? []
  const unchecked = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)

  return (
    <div className="tile grocery-tile">
      <div className="tile-eyebrow">Grocery list</div>

      {loading ? (
        <p className="grocery-empty">Loading…</p>
      ) : unchecked.length === 0 && checked.length === 0 ? (
        <p className="grocery-empty">List is empty — send a message to add items.</p>
      ) : (
        <ul className="grocery-list">
          {unchecked.map(item => (
            <li key={item.id} className="grocery-item">
              <button className="grocery-check" onClick={() => toggle({ variables: { id: item.id } })} />
              <span className="grocery-label">
                {item.name}
                {item.quantity && <span className="grocery-qty">{item.quantity}</span>}
              </span>
            </li>
          ))}
          {checked.map(item => (
            <li key={item.id} className="grocery-item grocery-item--done">
              <button
                className="grocery-check grocery-check--done"
                onClick={() => toggle({ variables: { id: item.id } })}
              >✓</button>
              <span className="grocery-label grocery-label--done">
                {item.name}
                {item.quantity && <span className="grocery-qty">{item.quantity}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
