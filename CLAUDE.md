# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for a Chinese-English dictionary, intended to support chinesenotes.com, ntireader.org, and hbreader.org. Currently a static UI scaffold with no backend integration.

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

No test runner is configured yet.

## Bundler note

Turbopack (Next.js default) requires native ARM64 binaries that are not installed. All scripts use `--webpack` to force the webpack bundler. Do not remove that flag.

## Architecture

Next.js 16 App Router, TypeScript, no external UI libraries. For a high-level view of the full system (frontend, Node.js backend, Firestore, reCAPTCHA, GCS, and the full-text search microservice) see the [Architecture section in README.md](README.md#architecture) and the diagram at [`drawings/architecture.dot`](drawings/architecture.dot) / [`drawings/architecture.png`](drawings/architecture.png).

Key source files:

- `src/app/layout.tsx` — root layout; sets `<html lang="zh">` and page metadata
- `src/app/page.tsx` — dictionary home page; delegates to `DictionaryApp`
- `src/app/globals.css` — all styles; plain CSS, no CSS modules or Tailwind
- `src/app/api/lookup/route.ts` — dictionary lookup API (session-gated, Firestore-counted, reCAPTCHA-enforced above threshold)
- `src/app/api/fulltext/route.ts` — proxies full-text search to the external microservice
- `src/lib/dictionary.ts` — loads dictionary index; Chinese segmentation and reverse lookup
- `src/lib/firestore.ts` — Firestore client; session interaction counting
- `src/lib/session.ts` — signed session cookie generation and HMAC verification
- `src/proxy.ts` — Next.js middleware; sets the session cookie on every response
