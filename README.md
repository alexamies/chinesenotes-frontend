# chinesenotes-frontend

Frontend for a Chinese-English dictionary, supporting [chinesenotes.com](https://chinesenotes.com), [ntireader.org](https://ntireader.org), and [hbreader.org](https://hbreader.org).

Built with Next.js 16 App Router and TypeScript. The same codebase serves all three sites; a `SITE_THEME` environment variable controls the colour scheme and which library texts are shown.

## Features

- **Dictionary lookup** — full-text search over 167,000 entries with multi-sense display and pinyin
- **Text segmentation** — greedy longest-match segmentation of Chinese input into dictionary words
- **Library reader** — browse classical texts chapter by chapter; click any word to see its definition inline
- **Multi-site theming** — `demo`, `chinesenotes`, `ntireader`, `hbreader` themes via a single env var

## Development

Prerequisites: Node.js 20+.

Install dependencies:

```shell
npm install
```

Copy the example env file and set a theme:

```shell
cp .env.local.example .env.local
# Edit .env.local and set SITE_THEME to one of: demo | chinesenotes | ntireader | hbreader
```

Start the dev server:

```shell
npm run dev
```

Open http://localhost:3000.

> **Bundler note:** Turbopack requires native ARM64 binaries that are not installed. All scripts use `--webpack` to force the webpack bundler. Do not remove that flag.

### Dictionary data

The dictionary is loaded from `data/dictionary.json` at startup. This file is generated from the chinesenotes.com TSV (requires the `../chinesenotes.com` repo checked out alongside this one):

```shell
node scripts/copy-dictionary.mjs
```

If the TSV is not present, the script falls back to `assets/example_dictionary.json` (a small subset used for development without the full dataset).

### Corpus

Library texts live under `corpus/`:

```
corpus/
  catalog.json          # master list of all works; controls which sites see which texts
  index/<work>.csv      # tab-separated chapter list for each work
  content/<work>/       # plain-text chapter files
```

To add a new text: add an entry to `catalog.json`, drop its chapter index CSV in `corpus/index/`, and add the `.txt` chapter files in `corpus/content/<id>/`. The next build discovers and pre-renders all pages automatically.

## Project structure

```
src/
  app/
    page.tsx                        # dictionary home page
    library/
      page.tsx                      # library index (filtered by SITE_THEME)
      [bookId]/
        page.tsx                    # chapter list
        [chapter]/
          page.tsx                  # chapter reader (server-segments text)
    api/lookup/route.ts             # dictionary lookup API
    entry/[term]/page.tsx           # full entry detail page
  components/
    ChapterReader.tsx               # interactive reader (click word → definition panel)
    DictionaryApp.tsx               # search input + results
    Header.tsx / HamburgerMenu.tsx  # site chrome
  lib/
    corpus.ts                       # reads catalog.json and chapter files at build time
    dictionary.ts                   # loads dictionary index from data/dictionary.json
    segmentation.ts                 # greedy longest-match segmentation
```

## Deployment

The app deploys to Google Cloud Run via Cloud Build. `SITE_THEME` is passed as a Docker build argument so that Next.js bakes the correct theme into statically pre-rendered pages at build time.

### One-time setup

Configure gcloud and select the right project:

```shell
gcloud config configurations create chinesenotes-demo
gcloud config configurations activate chinesenotes-demo
gcloud init
```

Create the Artifact Registry repository (if it does not already exist):

```shell
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format docker --location us-central1
```

### Building the dictionary before deploying

The full dictionary must be built locally before submitting to Cloud Build, because the source TSV is not available there:

```shell
node scripts/copy-dictionary.mjs
```

This writes `data/dictionary.json`. The `.gcloudignore` file overrides `.gitignore` to include `data/` in the Cloud Build upload so the pre-built file is available inside the Docker build.

### Deploy

```shell
gcloud builds submit --config cloudbuild.yaml .
```

This runs three Cloud Build steps:

1. `docker build` — builds the image with `--build-arg SITE_THEME=chinesenotes`
2. `docker push` — pushes to Artifact Registry
3. `gcloud run deploy` — deploys to Cloud Run and sets `SITE_THEME` as a runtime env var

Default substitutions in `cloudbuild.yaml` target chinesenotes.com. Override them for the other sites:

```shell
# ntireader.org
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _SITE_THEME=ntireader,_SERVICE_NAME=ntireader-frontend .

# hbreader.org
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _SITE_THEME=hbreader,_SERVICE_NAME=hbreader-frontend .
```

### Why SITE_THEME is a build-time argument

Next.js pre-renders static and SSG pages at `npm run build` time. If `SITE_THEME` were only a Cloud Run runtime variable it would not be visible during the build, and pre-rendered pages would fall back to the `demo` theme. Passing it as a Docker `ARG` and `ENV` before `npm run build` ensures the theme is baked correctly into all 100+ pre-rendered library pages.

## Available commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Run unit tests (Vitest) |
