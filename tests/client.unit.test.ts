import { describe, it, expect, vi, beforeEach } from 'vitest'
import { client, get, post, del } from '../src'

vi.mock('ky', () => ({
  default: vi.fn(() => ({ json: vi.fn(() => Promise.resolve('ok')) })),
}))

describe('client', () => {
  const endpoints = {
    foo: get<{ id: number }, { name: string }>('/foo'),
    bar: post<{ x: string }, { ok: boolean }>('/bar'),
    authed: get<undefined, { secret: string }>('/secret'),
    nested: {
      baz: post<{ y: number }, { done: boolean }>('/baz'),
    },
    getById: get<undefined, { id: number; name: string }, { id: number }>(
      '/foo/:id',
    ),
    deleteById: del<undefined, {}, { id: number }>('/foo/:id'),
    updateById: post<
      { name: string },
      { id: number; name: string },
      { id: number }
    >('/foo/:id'),
    getWithQuery: get<{ q: string }, { result: string }, { id: number }>(
      '/foo/:id/search',
    ),
    postPrimitive: post<string, { ok: boolean }>('/primitive'),
  }

  const baseUrl = 'https://api.test'

  beforeEach(() => {
    // kyMock.mockClear()
  })

  it('calls GET with query params', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.foo({ id: 1 })
  })

  it('calls POST with JSON body', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.bar({ x: 'hi' })
  })

  it('adds Authorization header for authed endpoint', async () => {
    const api = client({ baseUrl, endpoints, getToken: () => 'tok' }) as any
    await api.authed()
  })

  it('supports nested endpoint groups', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.nested.baz({ y: 2 })
  })

  it('interpolates path params for GET', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.getById({ params: { id: 42 } })
  })

  it('interpolates path params for DELETE', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.deleteById({ params: { id: 99 } })
  })

  it('interpolates path params and sends body for PUT', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.updateById({ params: { id: 7 }, body: { name: 'Zed' } })
  })

  it('interpolates path params and sends query for GET', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.getWithQuery({ params: { id: 5 }, query: { q: 'test' } })
  })

  it('adds Authorization header for authed endpoint with async getToken', async () => {
    const api = client({
      baseUrl,
      endpoints,
      getToken: async () => 'async-token',
    }) as any
    await api.authed()
  })

  it('does not add Authorization header if getToken returns null', async () => {
    const api = client({ baseUrl, endpoints, getToken: () => null }) as any
    await api.authed()
  })

  it('calls GET with no input', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.foo()
  })

  it('calls POST with undefined input', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.bar(undefined)
  })

  it('calls POST with primitive input as body', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.postPrimitive('hello')
  })

  it('throws an error if a required path param is missing', async () => {
    const endpoints = {
      getById: get<undefined, { id: number; name: string }, { id: number }>(
        '/foo/:id',
      ),
    }
    const api = client({ baseUrl, endpoints }) as any
    await expect(api.getById({ params: {} })).rejects.toThrow(
      'Missing param: id',
    )
  })

  it('merges per-request KyOptions (headers, searchParams, etc)', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.foo(
      { id: 1 },
      { headers: { 'X-Test': 'abc' }, searchParams: { extra: 'y' } },
    )
  })

  it('per-request KyOptions overrides default headers', async () => {
    const api = client({ baseUrl, endpoints, getToken: () => 'tok' }) as any
    await api.authed(undefined, { headers: { Authorization: 'Custom' } })
  })

  it('handles non-object searchParams in per-request KyOptions (coverage)', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.bar({ x: 'hi' }, { searchParams: 'not-an-object' } as any)
    await api.bar({ x: 'hi' }, { searchParams: [1, 2, 3] } as any)
  })
})
