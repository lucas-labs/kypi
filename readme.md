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
<a href="https://app.codecov.io/github/lucas-labs/kypi/tree/master" target="_blank"><img alt="Codecov" src="https://img.shields.io/codecov/c/github/lucas-labs/kypi?style=flat-square&labelColor=6e61b2&color=2b2b2d" /></a> <a href="https://github.com/lucas-labs/kypi/actions/workflows/ci.yml?query=branch%3Amaster" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/lucas-labs/kypi/ci.yml?style=flat-square&label=CI&labelColor=6e61b2&color=2b2b2d" /></a> 
<a href="./license"><img alt="License: MIT" src="https://img.shields.io/github/license/lucas-labs/kypi?style=flat-square&labelColor=6e61b2&color=2b2b2d" /></a> <a href="https://www.npmjs.com/package/kypi" target="_blank"><img alt="NPM Version" src="https://img.shields.io/npm/v/kypi?style=flat-square&labelColor=6e61b2&color=2b2b2d" /></a> 
<a href="https://bundlephobia.com/package/kypi" target="_blank"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/kypi?style=flat-square&label=bundlephobia&labelColor=6e61b2&color=2b2b2d" />
</a>
</p>

</br>

---

</br>

<!-- Basic Usage Example -->

```ts
import { get, post, client } from 'kypi'

const api = client({
  baseUrl: 'https://startrek.example/api',
  endpoints: {
    starships: {
      list: get<void, Starship[]>('/starships'),
      get: get<void, Starship, { id: number }>('/starships/:id'),
      create: post<StarshipCreate, Starship>('/starships'),
    }
  }
})

// Usage
const starships = await api.starships.list().json()
const enterprise = await api.starships.get({ id: 1701 }).json()
const newStarship = await api.starships.create({ 
  name: 'USS Discovery',
  class: 'Crossfield',
  registry: 'NCC-1031'
}).json()
```

<!-- TOC -->

## Table of Contents

- [What is kypi?](#what-is-kypi)
- [Install](#install)
- [Quickstart](#quickstart)
  - [1. Define your endpoints](#1-define-your-endpoints)
  - [2. Create a client](#2-create-a-client)
  - [3. Call your API](#3-call-your-api)
- [React Integration](#react-integration)
- [API Reference](#api-reference)
  - [Endpoint Creators](#endpoint-creators)
    - [Example](#example)
  - [Client](#client)
    - [Example](#example-1)
  - [Auth](#auth)
- [Advanced Usage](#advanced-usage)
  - [Path Params](#path-params)
  - [Query Params](#query-params)
  - [Per-request Options](#per-request-options)
- [React Example](#react-example)
- [TODO](#todo)
- [Thanks](#thanks)
- [License](#license)

<!-- /TOC -->

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
import { del, get, post, type EndpointGroup } from 'kypi'

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

- `client({ baseUrl, endpoints, getToken?, onError? })` — creates a type-safe API client.
  - `baseUrl`: the base URL for your API.
  - `endpoints`: an object containing your endpoint definitions.
  - `getToken` (optional): a function that returns the authentication token.
  - `onError` (optional): a function called with the error if a request fails. Useful for global error handling (e.g., showing a toast, logging out on 401, etc).

Each endpoint method:

- Accepts input (body/query/params) as the first argument.
- Accepts an optional [`ky` options](https://github.com/sindresorhus/ky#options) object as the second argument (for per-request overrides).

#### Example

```ts
const api = client({
  baseUrl: 'https://fakestoreapi.com',
  endpoints,
  onError: (error) => {
    if (error.response?.status === 401) {
      // handle unauthorized globally
      toast("Oops! You're not logged in, intruder!")
      logout()
    }
  },
})

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

We support passing custom [`ky` options](https://github.com/sindresorhus/ky#options).

```ts
await api.products({ search: 'foo' }, { headers: { 'X-Request-ID': 'abc', retry: { ... } } })
```

---

## React Example

Here's a taste of how you might use kypi in a React app:

```tsx
import { del, get, post } from 'kypi'
import { createClientHook } from 'kypi/react'

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
