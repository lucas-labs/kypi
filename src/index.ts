import ky, {
  HTTPError,
  type Options as KyOptions,
  type ResponsePromise,
} from 'ky'

export { HTTPError }
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete'

// eslint-disable-next-line unused-imports/no-unused-vars
export type Endpoint<In = unknown, Out = unknown, Params = any> = {
  method: HttpMethod
  url: string
  auth?: boolean
  __params?: Params // for type inference only
}

export interface EndpointGroup {
  [k: string]: Endpoint | EndpointGroup
}

// Helper types for input
// If Params is defined, require { params: Params }
// If In is defined and not void/undefined, require { body: In }
// If both, require { params: Params, body: In }
type InputFor<In, Params> = Params extends undefined
  ? In extends void | undefined
    ? undefined
    : In
  : In extends void | undefined
    ? { params: Params }
    : { params: Params; body: In }

type CallSig<In, Out, Params> =
  InputFor<In, Params> extends undefined
    ? (kyOptions?: KyOptions) => ResponsePromise<Out>
    : (
        input: InputFor<In, Params>,
        kyOptions?: KyOptions,
      ) => ResponsePromise<Out>

export type ClientOf<G extends EndpointGroup> = {
  [K in keyof G]: G[K] extends Endpoint<infer I, infer O, infer P>
    ? CallSig<I, O, P>
    : G[K] extends EndpointGroup
      ? ClientOf<G[K]>
      : never
}

export interface ApiClientOptions<E extends EndpointGroup> {
  baseUrl: string
  getToken?: () => string | null | Promise<string | null>
  endpoints: E
}

type EpOpts = Omit<Endpoint, 'method' | 'url' | '__params'>

/**
 * Creates an endpoint definition.
 *
 * @param method - HTTP method (e.g., 'get', 'post', etc.)
 * @param url - URL path for the endpoint
 * @param opts - Optional parameters, including `auth` to indicate if authentication is required
 */
export const endpoint = <In, Out, Params = undefined>(
  method: HttpMethod,
  url: string,
  opts: EpOpts = {},
): Endpoint<In, Out, Params> => ({
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
export const authed = <In, Out, Params = undefined>(
  method: HttpMethod,
  url: string,
): Endpoint<In, Out, Params> => endpoint(method, url, { auth: true })

// convenience functions for creating endpoints with common HTTP methods

/** Creates an HTTP GET endpoint. */
export const get = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
  opts?: EpOpts,
): Endpoint<In, Out, Params> => endpoint('get', url, opts)
/** Creates an HTTP POST endpoint. */
export const post = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
  opts?: EpOpts,
): Endpoint<In, Out, Params> => endpoint('post', url, opts)
/** Creates an HTTP PUT endpoint. */
export const put = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
  opts?: EpOpts,
): Endpoint<In, Out, Params> => endpoint('put', url, opts)
/** Creates an HTTP PATCH endpoint. */
export const patch = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
  opts?: EpOpts,
): Endpoint<In, Out, Params> => endpoint('patch', url, opts)
/** Creates an HTTP HEAD endpoint. */
export const head = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
  opts?: EpOpts,
): Endpoint<In, Out, Params> => endpoint('head', url, opts)
/** Creates an HTTP DELETE endpoint. */
export const del = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
  opts?: EpOpts,
): Endpoint<In, Out, Params> => endpoint('delete', url, opts)

// Convenience functions for creating authed endpoints with common HTTP methods

/** Creates an authed HTTP GET endpoint. */
export const aget = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
): Endpoint<In, Out, Params> => authed('get', url)
/** Creates an authed HTTP POST endpoint. */
export const apost = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
): Endpoint<In, Out, Params> => authed('post', url)
/** Creates an authed HTTP PUT endpoint. */
export const aput = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
): Endpoint<In, Out, Params> => authed('put', url)
/** Creates an authed HTTP PATCH endpoint. */
export const apatch = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
): Endpoint<In, Out, Params> => authed('patch', url)
/** Creates an authed HTTP HEAD endpoint. */
export const ahead = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
): Endpoint<In, Out, Params> => authed('head', url)
/** Creates an authed HTTP DELETE endpoint. */
export const adel = <In = undefined, Out = unknown, Params = undefined>(
  url: string,
): Endpoint<In, Out, Params> => authed('delete', url)

export { authed as aep, endpoint as ep }

function interpolateUrl(
  url: string,
  params: Record<string, any> | undefined,
): string {
  if (!params) return url
  return url.replaceAll(/:(\w+)/g, (_, key) => {
    if (params[key] === undefined) throw new Error(`Missing param: ${key}`)
    return encodeURIComponent(params[key])
  })
}

// helper to create a thenable proxy that defers the ky call until needed
function createDeferredKyCall(
  makeKyCall: () => Promise<ResponsePromise<any>>,
): ResponsePromise<any> {
  let promise: Promise<ResponsePromise<any>> | null = null
  const getPromise = () => {
    if (!promise) promise = makeKyCall()
    return promise
  }
  const handler: ProxyHandler<any> = {
    get(_target, prop: keyof ResponsePromise<any> | symbol) {
      if (prop === 'then') {
        // make this object awaitable
        return (...args: any[]) => getPromise().then(...args)
      }
      return (...args: any[]) =>
        getPromise().then((resp) => {
          const fn = resp[prop as keyof ResponsePromise<any>]
          if (typeof fn === 'function') {
            // @ts-expect-error: ky's methods accept any[] at runtime, this is safe
            return fn.apply(resp, args)
          }
          return fn
        })
    },
  }
  return new Proxy({}, handler) as ResponsePromise<any>
}

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
        const endpoint = value as Endpoint<any, any, any>

        client[key] = (
          input?: any,
          kyOptions?: KyOptions,
        ): ResponsePromise<any> => {
          const makeKyCall = async (): Promise<ResponsePromise<any>> => {
            let url = baseUrl + endpoint.url
            let params: any = undefined
            let body: any = undefined
            let query: any = undefined

            if (input && typeof input === 'object') {
              if ('params' in input) params = input.params
              if ('body' in input) body = input.body
              if ('query' in input) query = input.query
              if (!body) body = input
            } else if (input !== undefined) {
              body = input
            }

            url = interpolateUrl(url, params)

            let kyopts: KyOptions = { method: endpoint.method, headers: {} }

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
              if (query) {
                kyopts.searchParams = query
              } else if (
                input &&
                typeof input === 'object' &&
                !('body' in input) &&
                !('params' in input) &&
                !('query' in input)
              ) {
                kyopts.searchParams = input
              }
            } else if (body !== undefined) {
              kyopts.json = body
            }

            // merge user-provided KyOptions (user overrides)
            if (kyOptions) {
              const mergeObj = (a: any, b: any) => {
                const aObj =
                  a && typeof a === 'object' && !Array.isArray(a)
                    ? a
                    : undefined
                const bObj =
                  b && typeof b === 'object' && !Array.isArray(b)
                    ? b
                    : undefined
                if (aObj && bObj) return { ...aObj, ...bObj }
                if (b !== undefined) return b
                return a
              }
              kyopts = {
                ...kyopts,
                ...kyOptions,
                headers: { ...kyopts.headers, ...kyOptions.headers },
                searchParams: mergeObj(
                  kyopts.searchParams,
                  kyOptions.searchParams,
                ),
              }
            }

            return ky(url, kyopts)
          }

          return createDeferredKyCall(makeKyCall)
        }
      } else {
        client[key] = build(value as EndpointGroup)
      }
    }
    return client
  }

  return build(endpoints) as ClientOf<E>
}
