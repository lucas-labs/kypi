import React, { useState } from 'react'
import { del, get, post } from '../../src'
import { createClientHook } from '../../src/react'

const useApi = createClientHook({
  products: get<void, Array<{ id: number; title: string }>>('/products'),
  addProduct: post<{ title: string }, { id: number; title: string }>(
    '/products',
  ),
  deleteProduct: del<void, {}, { id: number }>('/products/:id'),
})

export function App() {
  const api = useApi({ baseUrl: 'https://fakestoreapi.com' })
  const [products, setProducts] = useState<
    Array<{ id: number; title: string }>
  >([])
  const [loading, setLoading] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const fetchProducts = async () => {
    setLoading(true)
    const data = await api.products().json()
    console.log('Fetched products:', data)
    setProducts(data)
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!newTitle) return
    setLoading(true)
    const product = { title: newTitle }
    await api.addProduct(product)
    setNewTitle('')
    await fetchProducts()
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    setLoading(true)
    await api.deleteProduct({ params: { id } })
    await fetchProducts()
    setLoading(false)
  }

  React.useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <div
      style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}
    >
      <h1>kypi Playground (Fake Store API)</h1>
      <div style={{ marginBottom: 16 }}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New product title"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newTitle}
          style={{ marginLeft: 8 }}
        >
          Add Product
        </button>
      </div>
      <button onClick={fetchProducts} disabled={loading}>
        Refresh
      </button>
      {loading && <p>Loading...</p>}
      <ul>
        {products.map((p) => (
          <li
            key={p.id}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {p.title}
            <button onClick={() => handleDelete(p.id)} disabled={loading}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
