import ky from 'ky'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  aget,
  apost,
  authed,
  client,
  endpoint,
  get,
  post,
  put,
  type EndpointGroup,
  patch,
  head,
  del,
  aput,
  apatch,
  ahead,
  adel,
  ep,
  aep,
} from '../src'

vi.mock('ky', () => ({
  default: vi.fn(() => ({ json: vi.fn(() => Promise.resolve('ok')) })),
}))

const kyMock = ky as unknown as ReturnType<typeof vi.fn>

describe('endpoint creators', () => {
  it('creates a basic endpoint', () => {
    const ep = endpoint('get', '/foo')
    expect(ep).toMatchObject({ method: 'get', url: '/foo', auth: false })
  })
  it('creates an authed endpoint', () => {
    const ep = authed('post', '/bar')
    expect(ep).toMatchObject({ method: 'post', url: '/bar', auth: true })
  })
  it('shorthands work', () => {
    expect(get('/a')).toMatchObject({ method: 'get', url: '/a' })
    expect(aget('/a')).toMatchObject({ method: 'get', url: '/a', auth: true })
    expect(post('/b')).toMatchObject({ method: 'post', url: '/b' })
    expect(apost('/b')).toMatchObject({ method: 'post', url: '/b', auth: true })
  })
})

describe('client', () => {
  beforeEach(() => {
    kyMock.mockClear()
  })

  const endpoints: EndpointGroup = {
    foo: get<{ id: number }, { name: string }>('/foo'),
    bar: post<{ x: string }, { ok: boolean }>('/bar'),
    authed: aget<undefined, { secret: string }>('/secret'),
    nested: {
      baz: put<{ y: number }, { done: boolean }>('/baz'),
    },
  }

  const baseUrl = 'https://api.test'

  it('calls GET with query params', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.foo({ id: 1 })
    expect(kyMock).toHaveBeenCalledWith(
      'https://api.test/foo',
      expect.objectContaining({ method: 'get', searchParams: { id: 1 } }),
    )
  })

  it('calls POST with JSON body', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.bar({ x: 'hi' })
    expect(kyMock).toHaveBeenCalledWith(
      'https://api.test/bar',
      expect.objectContaining({ method: 'post', json: { x: 'hi' } }),
    )
  })

  it('adds Authorization header for authed endpoint', async () => {
    const api = client({ baseUrl, endpoints, getToken: () => 'tok' }) as any
    await api.authed()
    expect(kyMock).toHaveBeenCalledWith(
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
    expect(kyMock).toHaveBeenCalledWith(
      'https://api.test/baz',
      expect.objectContaining({ method: 'put', json: { y: 2 } }),
    )
  })

  it('adds Authorization header for authed endpoint with async getToken', async () => {
    const api = client({
      baseUrl,
      endpoints,
      getToken: async () => 'async-token',
    }) as any
    await api.authed()
    expect(kyMock).toHaveBeenCalledWith(
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
    expect(kyMock).toHaveBeenCalledWith(
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
    expect(kyMock).toHaveBeenCalledWith(
      'https://api.test/foo',
      expect.objectContaining({ method: 'get' }),
    )
  })

  it('calls POST with undefined input', async () => {
    const api = client({ baseUrl, endpoints }) as any
    await api.bar(undefined)
    expect(kyMock).toHaveBeenCalledWith(
      'https://api.test/bar',
      expect.objectContaining({ method: 'post' }),
    )
  })
})

describe('utility function coverage', () => {
  it('patch, head, del, aput, apatch, ahead, adel, ep, aep work', () => {
    expect(patch('/p')).toMatchObject({ method: 'patch', url: '/p' })
    expect(head('/h')).toMatchObject({ method: 'head', url: '/h' })
    expect(del('/d')).toMatchObject({ method: 'delete', url: '/d' })
    expect(aput('/ap')).toMatchObject({ method: 'put', url: '/ap', auth: true })
    expect(apatch('/apc')).toMatchObject({
      method: 'patch',
      url: '/apc',
      auth: true,
    })
    expect(ahead('/ah')).toMatchObject({
      method: 'head',
      url: '/ah',
      auth: true,
    })
    expect(adel('/ad')).toMatchObject({
      method: 'delete',
      url: '/ad',
      auth: true,
    })
    expect(ep('get', '/ep')).toMatchObject({
      method: 'get',
      url: '/ep',
      auth: false,
    })
    expect(aep('post', '/aep')).toMatchObject({
      method: 'post',
      url: '/aep',
      auth: true,
    })
  })
})
