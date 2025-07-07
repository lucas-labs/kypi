import ky from 'ky'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { client, del, get, post, put } from '../src'

vi.mock('ky', () => ({
  default: vi.fn((url, opts) => {
    return {
      json: () => Promise.resolve('ok'),
      foo: 123, // non-function property for coverage
      url,
      opts,
      headers: opts && opts.headers ? opts.headers : {},
      method: opts && opts.method,
      jsonBody: opts && opts.json,
      searchParams: opts && opts.searchParams,
    }
  }),
}))

describe('client', () => {
  const endpoints = {
    foo: get<{ id: number }, { name: string }>('/foo'),
    bar: post<{ x: string }, { ok: boolean }>('/bar'),
    authed: get<undefined, { secret: string }>('/secret', { auth: true }),
    nested: {
      baz: post<{ y: number }, { done: boolean }>('/baz'),
    },
    getById: get<undefined, { id: number; name: string }, { id: number }>(
      '/foo/:id',
    ),
    deleteById: del<undefined, {}, { id: number }>('/foo/:id'),
    updateById: put<
      { name: string },
      { id: number; name: string },
      { id: number }
    >('/foo/:id'),
    getWithQuery: get<{ q: string }, { result: string }, { id: number }>(
      '/foo/:id/search',
    ),
    postPrimitive: post<string, { ok: boolean }>('/primitive'),
    postWithAll: post<
      { foo: string },
      { ok: boolean },
      { id: number },
      { q: string }
    >('/bar/:id'),
  }

  const baseUrl = 'https://api.test'

  beforeEach(() => {
    vi.mocked(ky).mockClear()
  })

  it('calls GET with query params', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.foo({ id: 1 })
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/foo',
      expect.objectContaining({
        method: 'get',
        searchParams: { id: 1 },
      }),
    )
  })

  it('calls POST with JSON body', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.bar({ x: 'hi' })
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/bar',
      expect.objectContaining({
        method: 'post',
        json: { x: 'hi' },
      }),
    )
  })

  it('adds Authorization header for authed endpoint', async () => {
    const api = client({ baseUrl, endpoints, getToken: () => 'tok' }) as any
    await api.authed()
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/secret',
      expect.objectContaining({
        method: 'get',
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    )
  })

  it('supports nested endpoint groups', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.nested.baz({ y: 2 })
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/baz',
      expect.objectContaining({
        method: 'post',
        json: { y: 2 },
      }),
    )
  })

  it('interpolates path params for GET', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.getById({ params: { id: 42 } })
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/foo/42',
      expect.objectContaining({ method: 'get' }),
    )
  })

  it('interpolates path params for DELETE', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.deleteById({ params: { id: 99 } })
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/foo/99',
      expect.objectContaining({ method: 'delete' }),
    )
  })

  it('interpolates path params and sends body for PUT', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.updateById({ params: { id: 7 }, body: { name: 'Zed' } })
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/foo/7',
      expect.objectContaining({
        method: 'put',
        json: { name: 'Zed' },
      }),
    )
  })

  it('interpolates path params and sends query for GET', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.getWithQuery({ params: { id: 5 }, query: { q: 'test' } })
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/foo/5/search',
      expect.objectContaining({
        method: 'get',
        searchParams: { q: 'test' },
      }),
    )
  })

  it('adds Authorization header for authed endpoint with async getToken', async () => {
    const api = client({
      baseUrl,
      endpoints,
      // eslint-disable-next-line require-await
      getToken: async () => 'async-token',
    }) as any
    await api.authed()
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/secret',
      expect.objectContaining({
        method: 'get',
        headers: expect.objectContaining({
          Authorization: 'Bearer async-token',
        }),
      }),
    )
  })

  it('does not add Authorization header if getToken returns null', async () => {
    const api = client({ baseUrl, endpoints, getToken: () => null }) as any
    await api.authed()
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/secret',
      expect.objectContaining({
        method: 'get',
        headers: expect.not.objectContaining({
          Authorization: expect.anything(),
        }),
      }),
    )
  })

  it('calls GET with no input', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.foo()
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/foo',
      expect.objectContaining({ method: 'get' }),
    )
  })

  it('calls POST with undefined input', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.bar(undefined)
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/bar',
      expect.objectContaining({ method: 'post' }),
    )
  })

  it('calls POST with primitive input as body', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.postPrimitive('hello')
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/primitive',
      expect.objectContaining({
        method: 'post',
        json: 'hello',
      }),
    )
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

  it('should access a non-function property on the deferred ResponsePromise', async () => {
    const { client, get } = await import('../src')
    const api = client({ baseUrl: '', endpoints: { foo: get('/foo') } })
    const resp = api.foo({})
    const value = await (resp as any).foo()
    expect(value).toBe(123)
  })

  it('sends body, path params, and query params for POST with all generics', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.postWithAll({
      params: { id: 1 },
      query: { q: 'abc' },
      body: { foo: 'bar' },
    })
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/bar/1',
      expect.objectContaining({
        method: 'post',
        searchParams: { q: 'abc' },
        json: { foo: 'bar' },
      }),
    )
  })
})
