import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { get, type EndpointGroup } from '../src'
import { createClientHook } from '../src/react'

vi.mock('ky', () => ({
  default: vi.fn((url, opts) => {
    const response = {
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      json: <J = unknown,>() => Promise.resolve('ok' as unknown as J),
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

const endpoints: EndpointGroup = {
  foo: get<{ id: number }, { name: string }>('/foo'),
}

describe('createClientHook', () => {
  it('returns a memoized client', () => {
    const useApi = createClientHook(endpoints)
    const { result, rerender } = renderHook(
      ({ baseUrl }) => useApi({ baseUrl }),
      { initialProps: { baseUrl: 'a' } },
    )
    const first = result.current
    rerender({ baseUrl: 'a' })
    expect(result.current).toBe(first)
    rerender({ baseUrl: 'b' })
    expect(result.current).not.toBe(first)
  })

  it('client works in hook', async () => {
    const useApi = createClientHook(endpoints)
    const { result } = renderHook(() => useApi({ baseUrl: 'x' }))
    await act(async () => {
      const res = await (result.current as any).foo({ id: 1 })
      expect(await res.json()).toBe('ok')
    })
  })
})
