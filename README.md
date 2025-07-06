# kypi

[![codecov](https://codecov.io/gh/lucas-labs/kypi/branch/main/graph/badge.svg)](https://codecov.io/gh/lucas-labs/kypi)
![Unit Test](https://github.com/lucas-labs/kypi/actions/workflows/unit-test.yml/badge.svg)
[![npm version](https://img.shields.io/npm/v/kypi.svg)](https://www.npmjs.com/package/kypi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![bundlephobia](https://img.shields.io/bundlephobia/minzip/kypi)](https://bundlephobia.com/result?p=kypi)

Utility functions for building API clients.

## Installation

```sh
bun add kypi
```

## Usage

### Core utilities

```ts
import { ... } from 'kypi';
```

### React utilities (optional)

```ts
import { ... } from 'kypi/react';
```

> React is an optional peer dependency. You only need it if you use the React-specific utilities.

## Publishing

This library uses Bun and tsdown for building and publishing.
