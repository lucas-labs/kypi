import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { client, get, post, del } from '../src'

// Helper to create a Response object for fetch mocks
function createJsonResponse(body: any, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
}

describe('kypi client', () => {
  const endpoints = {
    products: get<void, { id: number; title: string }[]>('/products', {
      auth: true,
    }),
    addProduct: post<{ title: string }, { id: number; title: string }>(
      '/products',
    ),
    deleteProduct: del<void, {}, { id: number }>('/products/:id'),
  }

  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('should support await api.products().json()', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createJsonResponse([{ id: 1, title: 'Test' }], { status: 200 }),
      )
    const api = client({ baseUrl: 'https://example.com', endpoints })
    const data = await api.products().json()
    expect(data).toEqual([{ id: 1, title: 'Test' }])
  })

  it('should support POST and return response', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createJsonResponse({ id: 2, title: 'New' }, { status: 201 }),
      )
    const api = client({ baseUrl: 'https://example.com', endpoints })
    const data = await api.addProduct({ title: 'New' }).json()
    expect(data).toEqual({ id: 2, title: 'New' })
  })

  it('should support async getToken and set Authorization header', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createJsonResponse([{ id: 1, title: 'Test' }], { status: 200 }),
      )
    const getToken = vi.fn().mockResolvedValue('mytoken')
    const api = client({ baseUrl: 'https://example.com', endpoints, getToken })
    await api.products().json()
    const fetchCall = (globalThis.fetch as any).mock.calls[0]
    const req = fetchCall[0] // This is the Request object
    const authHeader = req.headers.get('Authorization')
    expect(authHeader).toBe('Bearer mytoken')
  })

  it('should throw on HTTP error', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createJsonResponse(
          { error: 'Not found' },
          { status: 404, statusText: 'Not Found' },
        ),
      )
    const api = client({ baseUrl: 'https://example.com', endpoints })
    await expect(api.products().json()).rejects.toThrow()
  })

  it('should support await api.products()', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createJsonResponse([{ id: 1, title: 'Test' }], { status: 200 }),
      )
    const api = client({ baseUrl: 'https://example.com', endpoints })
    const resp = await api.products()
    expect(typeof resp.json).toBe('function')
    const data = await resp.json()
    expect(data).toEqual([{ id: 1, title: 'Test' }])
  })
})
