import ky, { HTTPError, type Options as KyOptions } from 'ky'

export { HTTPError }
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete'

// eslint-disable-next-line unused-imports/no-unused-vars
export type Endpoint<In = unknown, Out = unknown> = {
  method: HttpMethod
  url: string
  auth?: boolean
}

export interface EndpointGroup {
  [k: string]: Endpoint | EndpointGroup
}

// type‑level magic
type CallSig<In, Out> =
  // allow zero args when the request body is void/never/undefined
  [In] extends [void | undefined]
    ? () => Promise<Out>
    : (input: In) => Promise<Out>

export type ClientOf<G extends EndpointGroup> = {
  [K in keyof G]: G[K] extends Endpoint<infer I, infer O>
    ? CallSig<I, O>
    : G[K] extends EndpointGroup
      ? ClientOf<G[K]>
      : never
}

export interface ApiClientOptions<E extends EndpointGroup> {
  baseUrl: string
  getToken?: () => string | null | Promise<string | null>
  endpoints: E
}

type EpOpts = Omit<Endpoint, 'method' | 'url'>

/**
 * Creates an endpoint definition.
 *
 * @param method - HTTP method (e.g., 'get', 'post', etc.)
 * @param url - URL path for the endpoint
 * @param opts - Optional parameters, including `auth` to indicate if authentication is required
 */
export const endpoint = <In, Out>(
  method: HttpMethod,
  url: string,
  opts: EpOpts = {},
): Endpoint<In, Out> => ({
  method,
  url,
  auth: opts.auth ?? false,
})

/**
 * Same as `endpoint`, but it creates an endpoint that requires authentication.
 *
 * Will use the provided `getToken` function to retrieve the token and add it to the `Authorization`
 * header.
 */
export const authed = <In, Out>(
  method: HttpMethod,
  url: string,
): Endpoint<In, Out> => endpoint(method, url, { auth: true })

// Convenience functions for creating endpoints with common HTTP methods

/** Creates an HTTP GET endpoint. */
export const get = <In, Out>(url: string, opts?: EpOpts): Endpoint<In, Out> =>
  endpoint('get', url, opts)
/** Creates an HTTP POST endpoint. */
export const post = <In, Out>(url: string, opts?: EpOpts): Endpoint<In, Out> =>
  endpoint('post', url, opts)
/** Creates an HTTP PUT endpoint. */
export const put = <In, Out>(url: string, opts?: EpOpts): Endpoint<In, Out> =>
  endpoint('put', url, opts)
/** Creates an HTTP PATCH endpoint. */
export const patch = <In, Out>(url: string, opts?: EpOpts): Endpoint<In, Out> =>
  endpoint('patch', url, opts)
/** Creates an HTTP HEAD endpoint. */
export const head = <In, Out>(url: string, opts?: EpOpts): Endpoint<In, Out> =>
  endpoint('head', url, opts)
/** Creates an HTTP DELETE endpoint. */
export const del = <In, Out>(url: string, opts?: EpOpts): Endpoint<In, Out> =>
  endpoint('delete', url, opts)

// Convenience functions for creating authed endpoints with common HTTP methods

/** Creates an authed HTTP GET endpoint. */
export const aget = <In, Out>(url: string): Endpoint<In, Out> =>
  authed('get', url)
/** Creates an authed HTTP POST endpoint. */
export const apost = <In, Out>(url: string): Endpoint<In, Out> =>
  authed('post', url)
/** Creates an authed HTTP PUT endpoint. */
export const aput = <In, Out>(url: string): Endpoint<In, Out> =>
  authed('put', url)
/** Creates an authed HTTP PATCH endpoint. */
export const apatch = <In, Out>(url: string): Endpoint<In, Out> =>
  authed('patch', url)
/** Creates an authed HTTP HEAD endpoint. */
export const ahead = <In, Out>(url: string): Endpoint<In, Out> =>
  authed('head', url)
/** Creates an authed HTTP DELETE endpoint. */
export const adel = <In, Out>(url: string): Endpoint<In, Out> =>
  authed('delete', url)

export { authed as aep, endpoint as ep }

/**
 * Creates a client for the given endpoint group.
 *
 * @param options - Options for the API client.
 * @param options.baseUrl - The base URL for the API
 * @param options.getToken - Optional function to retrieve an authentication token
 * @param options.endpoints - The endpoint group definition
 */
export function client<E extends EndpointGroup>({
  baseUrl,
  getToken,
  endpoints,
}: ApiClientOptions<E>): ClientOf<E> {
  const build = (group: EndpointGroup): any => {
    const client: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(group)) {
      if ('method' in value) {
        // it's an endpoint
        const endpoint = value as Endpoint<any, any>

        client[key] = async (input?: unknown) => {
          const url = baseUrl + endpoint.url
          const kyopts: KyOptions = { method: endpoint.method, headers: {} }

          // auth header
          if (endpoint.auth) {
            const token = getToken?.()
            if (token) {
              if (token instanceof Promise) {
                const awaitedToken = await token
                ;(kyopts.headers as Record<string, string>).Authorization =
                  `Bearer ${awaitedToken}`
              } else {
                ;(kyopts.headers as Record<string, string>).Authorization =
                  `Bearer ${token}`
              }
            }
          }

          // payload vs query string
          if (endpoint.method === 'get' || endpoint.method === 'head') {
            if (input && typeof input === 'object') {
              kyopts.searchParams = input as Record<string, any>
            }
          } else if (input !== undefined) {
            kyopts.json = input
          }

          return ky(url, kyopts).json()
        }
      } else {
        // nested group
        client[key] = build(value as EndpointGroup)
      }
    }
    return client
  }

  return build(endpoints) as ClientOf<E>
}
