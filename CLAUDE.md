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

Next.js 16 App Router, TypeScript, no external UI libraries.

- `src/app/layout.tsx` — root layout; sets `<html lang="zh">` and page metadata
- `src/app/page.tsx` — single dictionary page: text input + Find button + results placeholder; no event handlers wired yet
- `src/app/globals.css` — all styles; plain CSS, no CSS modules or Tailwind

The app currently pre-renders as fully static content (`○` in build output). When search functionality is added, `page.tsx` will need to become a Client Component (`"use client"`) to manage input state and fetch results.
