<div align="center">
	<br>
	<div>
		<img width="500" src="media/logo.svg" alt="kypi">
	</div>
	<br>
	<h1>kypi</h1>
	<p>
		<b>Type-safe, ergonomic API client builder for TypeScript & React based on <code>ky</code></b>
	</p>
	<br>
</div>

<p align="center">
<img alt="Codecov" src="https://img.shields.io/codecov/c/github/lucas-labs/kypi?style=flat-square&labelColor=6e61b2&color=2b2b2d"> <img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/lucas-labs/kypi/ci.yml?style=flat-square&label=CI&labelColor=6e61b2&color=2b2b2d"> 
<img alt="License: MIT" src="https://img.shields.io/github/license/lucas-labs/kypi?style=flat-square&labelColor=6e61b2&color=2b2b2d"> <img alt="NPM Version" src="https://img.shields.io/npm/v/kypi?style=flat-square&labelColor=6e61b2&color=2b2b2d"> 
<img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/kypi?style=flat-square&label=bundlephobia&labelColor=6e61b2&color=2b2b2d">
</p>

<!-- [![npm version](https://img.shields.io/npm/v/kypi.svg)](https://www.npmjs.com/package/kypi)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/kypi)](https://bundlephobia.com/result?p=kypi) -->

---

## What is kypi?

**kypi** is a small, type-safe toolkit for building API clients in TypeScript, with optional React integration.

It's built on top of the fantastic [`ky`](https://github.com/sindresorhus/ky) HTTP client by [Sindre Sorhus](https://sindresorhus.com/) (thank you Sindre! 🙏), and aims to make API clients in your apps as delightful as making raw requests with `ky`.

- **Type-safe endpoints**: Define your API once, get full type inference everywhere.
- **Path params, query, body**: All handled, all typed.
- **Auth?** Just a flag and a token getter (only supports Authorization Bearer for now).
- **React?** One hook, instant client, no magic.
- **Small**: Zero dependencies except for `ky` (and React, if you use the React hook).

---

## Install

```bash
bun add kypi
# or
npm install kypi
# or
yarn add kypi
# or... or... or... or... ERROR: Maximum call stack size exceeded 😝
```

> _React is an optional peer dependency. You only need it if you use the React hook._

---

## Quickstart

### 1. Define your endpoints

```ts
import { get, post, del, type EndpointGroup } from 'kypi'

const endpoints = {
  products: get<void, Array<{ id: number; title: string }>>('/products'),
  addProduct: post<{ title: string }, { id: number; title: string }>(
    '/products',
  ),
  deleteProduct: del<void, {}, { id: number }>('/products/:id'),
} satisfies EndpointGroup
```

### 2. Create a client

```ts
import { client } from 'kypi'

const api = client({
  baseUrl: 'https://fakestoreapi.com',
  endpoints,
  // Optional: getToken for auth endpoints
  getToken: () => localStorage.getItem('token'),
})
```

### 3. Call your API

```ts
// GET (no params)
const products = await api.products().json()

// POST (with body)
const newProduct = await api.addProduct({ title: 'New' })

// DELETE (with path param)
await api.deleteProduct({ params: { id: 42 } })
```

---

## React Integration

Want to use your API client in React, with full type safety and memoization?  
Just use the `createClientHook`:

```ts
import { createClientHook } from 'kypi/react'

const useApi = createClientHook(endpoints)

function MyComponent() {
  const api = useApi({ baseUrl: 'https://fakestoreapi.com' })
  // ...use api.products(), api.addProduct(), etc.
}
```

See [`playground/src/App.tsx`](playground/src/App.tsx) for a real-world example using the [Fake Store API](https://fakestoreapi.com/).

---

## API Reference

### Endpoint Creators

- `get`, `post`, `put`, `patch`, `head`, `del` — create endpoints for each HTTP method.
- `aget`, `apost`, `aput`, `apatch`, `ahead`, `adel` — same, but require authentication.
- `endpoint`, `authed` — low-level endpoint creators.

Each endpoint is fully typed:

- **Input**: body, query, and/or path params (with type inference).
- **Output**: response type.

#### Example

```ts
const getUser = get<void, { id: number; name: string }, { id: number }>(
  '/users/:id',
)
```

### Client

- `client({ baseUrl, endpoints, getToken? })` — creates a type-safe API client.

Each endpoint method:

- Accepts input (body/query/params) as the first argument.
- Accepts an optional [`ky` options](https://github.com/sindresorhus/ky#options) object as the second argument (for per-request overrides).

#### Example

```ts
await api.products({ id: 1 }, { headers: { 'X-Foo': 'bar' } })
```

### Auth

- Mark an endpoint as `auth: true` (or use `aget`, `apost`, etc.).
- Provide a `getToken` function to the client.
- The token will be sent as a `Bearer` in the `Authorization` header.

---

## Advanced Usage

### Path Params

Endpoints like `/users/:id` are automatically interpolated:

```ts
await api.getUser({ params: { id: 123 } })
```

### Query Params

For GET/HEAD, you can pass query params as the input, or as `{ query: ... }`:

```ts
await api.products({ search: 'foo' })
await api.products({ query: { search: 'foo' } })
```

### Per-request Options

Override any [`ky` option](https://github.com/sindresorhus/ky#options) per call:

```ts
await api.products(undefined, { headers: { 'X-Request-ID': 'abc' } })
```

---

## React Example

Here's a taste of how you might use kypi in a React app:

```tsx
import { createClientHook } from 'kypi/react'
import { get, post, del } from 'kypi'

const useApi = createClientHook({
  products: get<void, Array<{ id: number; title: string }>>('/products'),
  addProduct: post<{ title: string }, { id: number; title: string }>(
    '/products',
  ),
  deleteProduct: del<void, {}, { id: number }>('/products/:id'),
})

function App() {
  const api = useApi({ baseUrl: 'https://fakestoreapi.com' })
  // ...use api.products(), api.addProduct(), etc.
}
```

---

## TODO

- [ ] Support for other auth schemes (not just Bearer)
  - [ ] Basic Auth
  - [ ] API Key in header
  - [ ] Custom header
  - [ ] Token refresh?
- [ ] Your ideas? PRs and issues welcome!

---

## Thanks

- **ky** by [Sindre Sorhus](https://github.com/sindresorhus/ky) — the HTTP client that does all the heavy lifting.
- Everyone who builds and shares open source. You rock.

> [!NOTE]
> The `kypi` logo is obviously inspired by `ky`’s logo, but since I’m from Argentina, I chose jacaranda blossoms instead of sakura to give it a unique touch—and because I like jacarandas.

---

## License

MIT © [Lucas Colombo](https://github.com/lucas-labs)

---

With 🧉 from Argentina 🇦🇷
