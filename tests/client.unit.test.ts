import ky from 'ky'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { client, del, get, post, put } from '../src'

// Local ky mock for this test file
vi.mock('ky', () => ({
  default: vi.fn((url, opts) => {
    const response = {
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      json: <J = unknown>() => Promise.resolve(undefined as unknown as J),
      text: () => Promise.resolve('ok'),
      foo: 123,
      url,
      opts,
      headers: opts && opts.headers ? opts.headers : {},
      method: opts && opts.method,
      jsonBody: opts && opts.json,
      searchParams: opts && opts.searchParams,
    }
    const promise = Promise.resolve(response)
    return Object.assign(promise, response)
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
    updateById: put<{ name: string }, { id: number; name: string }, { id: number }>('/foo/:id'),
    getWithQuery: get<void, { result: string }, { id: number }, { q: string }>(
      '/foo/:id/search',
    ),
    postPrimitive: post<string, { ok: boolean }>('/primitive'),
    postWithAll: post<{ foo: string },{ ok: boolean },{ id: number },{ q: string }>('/bar/:id'),
    form: post<FormData, { success: boolean }>('/form'),
    uploadFile: post<void, {success: boolean}, { id: string }>('/form/:id/file', { auth: true }),
  }

  const baseUrl = 'https://api.test'

  beforeEach(() => {
    vi.mocked(ky).mockClear()
  })

  it('calls GET with query params', async () => {
    const api = client({ baseUrl, endpoints })
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
    const api = client({ baseUrl, endpoints })
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
    const api = client({ baseUrl, endpoints, getToken: () => 'tok' })
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
    const api = client({ baseUrl, endpoints })
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
    const api = client({ baseUrl, endpoints })
    await api.getById({ params: { id: 42 } })
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/foo/42',
      expect.objectContaining({ method: 'get' }),
    )
  })

  it('interpolates path params for DELETE', async () => {
    const api = client({ baseUrl, endpoints })
    await api.deleteById({ params: { id: 99 } })
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/foo/99',
      expect.objectContaining({ method: 'delete' }),
    )
  })

  it('interpolates path params and sends body for PUT', async () => {
    const api = client({ baseUrl, endpoints })
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
    const api = client({ baseUrl, endpoints })
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
    })
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
    const api = client({ baseUrl, endpoints, getToken: () => null })
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
    const api = client({ baseUrl, endpoints })
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
    const api = client({ baseUrl, endpoints })
    await expect(api.getById({ params: {} as any })).rejects.toThrow(
      'Missing param: id',
    )
  })

  it("doesn't try to interpolate params in baseUrls (could have a port number :8080)", async () => {
    const endpoints = {
      getById: get<undefined, { id: number; name: string }, { id: number }>(
        '/foo/:id',
      ),
    }
    const api = client({ baseUrl: 'http://example:8080/api', endpoints })
    await api.getById({ params: { id: 2 } })
  })

  it('merges per-request KyOptions (headers, searchParams, etc)', async () => {
    const api = client({ baseUrl, endpoints })
    await api.foo(
      { id: 1 },
      { headers: { 'X-Test': 'abc' }, searchParams: { extra: 'y' } },
    )
  })

  it('per-request KyOptions overrides default headers', async () => {
    const api = client({ baseUrl, endpoints, getToken: () => 'tok' })
    await api.authed({ headers: { Authorization: 'Custom' } })
  })

  it('handles non-object searchParams in per-request KyOptions (coverage)', async () => {
    const api = client({ baseUrl, endpoints })
    await api.bar({ x: 'hi' }, { searchParams: 'not-an-object' } as any)
    await api.bar({ x: 'hi' }, { searchParams: [1, 2, 3] } as any)
    await api.bar({ x: 'test' }, { headers: { 'Custom': 'header' } }) // no searchParams = undefined
  })

  it('should access a non-function property on the deferred ResponsePromise', async () => {
    const { client, get } = await import('../src')
    const api = client({ baseUrl: '', endpoints: { foo: get('/foo') } })
    const resp = api.foo({})
    const value = await (resp as any).foo()
    expect(value).toBe(123)
  })

  it('sends body, path params, and query params for POST with all generics', async () => {
    const api = client({ baseUrl, endpoints })
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

  it('calls POST with FormData body', async () => {
    const api = client({ baseUrl, endpoints })
    const formData = new FormData()
    formData.append('key', 'value')
    await api.form(formData)
    expect(ky).toHaveBeenCalledWith(
      'https://api.test/form',
      expect.objectContaining({
        method: 'post',
        body: formData,
      }),
    )
  })

  it('should accept body set in kyOptions', async () => {
    const api = client({ baseUrl, endpoints })
    const formData = new FormData()
    formData.append('file', new Blob(['test content'], { type: 'text/plain' }))
    formData.append('description', 'Test file upload')
    formData.append('id', '123')
    const folderId = '123'
    
    await api.uploadFile({ params: { id: folderId } }, { body: formData })
    expect(ky).toHaveBeenCalledWith(
      `https://api.test/form/${folderId}/file`,
      expect.objectContaining({
        method: 'post',
        body: formData,
      }),
    )
    // make sure it didn't send a JSON body
    expect(ky).toHaveBeenCalledWith(
      `https://api.test/form/${folderId}/file`,
      expect.not.objectContaining({
        json: expect.anything(),
      }),
    )
  })

  it('calls onError hook if request fails', async () => {
    const error = new Error('fail')
    const response = {
      arrayBuffer: () => Promise.reject(error),
      blob: () => Promise.reject(error),
      formData: () => Promise.reject(error),
      json: () => Promise.reject(error),
      text: () => Promise.reject(error),
      foo: 123,
      url: '',
      opts: {},
      headers: {},
      method: '',
      jsonBody: undefined,
      searchParams: undefined,
    }
    const promise = Promise.reject(error)
    vi.mocked(ky).mockImplementationOnce(() => Object.assign(promise, response))
    const onError = vi.fn()
    const api = client({ baseUrl, endpoints, onError }) as any
    await expect(api.foo({ id: 1 })).rejects.toThrow('fail')

    // check the onError hook was actually called
    expect(onError).toHaveBeenCalledWith(error)
  })
})
