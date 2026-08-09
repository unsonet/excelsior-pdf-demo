# @unsonet/excelsior-pdf-demo

Interactive demo application for the **`@unsonet/excelsior-pdf-parser`** library.

Upload PDF documents, visually browse their pages, and extract tabular data in **HTML** and **JSON** formats — all in the browser.

---

## Features

- 📄 **Drag & Drop** PDF file upload
- 🖼️ **Page rendering** via PDF.js
- 📊 **Table extraction** powered by `@unsonet/excelsior-pdf-parser`
- 🔄 **Format toggle** — view results as HTML or JSON
- 📑 **Pagination** — navigate documents page by page
- 🗂️ **Built-in samples** — test PDFs for quick start

---

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) / npm / yarn
- [Nx](https://nx.dev/) (globally or via `npx`)

---

## Installation

This repository is part of an Nx monorepo. Make sure root dependencies are installed:

```bash
# From the monorepo root
pnpm install
```

---

## Running

### Development server

```bash
nx serve excelsior-pdf-demo
```

The app will be available at: `http://localhost:4200`

### Production build

```bash
nx build excelsior-pdf-demo --configuration=production
```

Build output is located at:
```
dist/apps/excelsior-pdf-demo/
```

### Serve the production build locally

```bash
nx build excelsior-pdf-demo --configuration=production
npx serve dist/apps/excelsior-pdf-demo
```

---

## Project Structure

```
apps/excelsior-pdf-demo/
├── src/
│   ├── index.html              # Main HTML page
│   ├── main.ts                 # Application entry point
│   ├── styles.scss             # Application styles
│   ├── global.d.ts             # Global type declarations
│   └── assets/                 # Static assets
│      ├── js/                  # Third-party scripts 
│      └── pdf/                 # Sample PDF files
├── project.json                # Nx targets configuration
├── webpack.config.js           # Webpack configuration
├── tsconfig.json               # TypeScript configuration
└── tsconfig.app.json           # App-specific TS config
```

---

## Nx Targets

| Target | Command | Description |
|--------|---------|-------------|
| `webpack:build` | `nx run excelsior-pdf-demo:webpack:build` | Production build via Webpack |
| `webpack:serve` | `nx run excelsior-pdf-demo:webpack:serve` | Dev server with hot reload |

---

## Dependencies

### Runtime
- [`pdfjs-dist`](https://github.com/mozilla/pdf.js) — PDF rendering in the browser
- [`jsnview`](https://github.com/yesmeck/jsnview) — JSON tree visualization
- `@unsonet/excelsior-pdf-parser` — PDF table extraction engine *(from monorepo or npm)*

### Development
- `@nx/webpack` — Nx Webpack plugin
- `swc-loader` / `@swc/core` — TypeScript compilation
- `webpack-cli` — Webpack CLI

---

## License

MIT © [Unsonet](https://github.com/unsonet)

---

## Related Projects

- [`@unsonet/excelsior-pdf-parser`](https://github.com/unsonet/excelsior-pdf) — Core library for PDF table extraction
