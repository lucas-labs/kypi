import { describe, expect, it } from 'vitest'
import {
  adel,
  aep,
  aget,
  ahead,
  apatch,
  apost,
  aput,
  authed,
  del,
  endpoint,
  ep,
  get,
  head,
  patch,
  post,
} from '../src'

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
