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

The library feature is driven by the [chinesenotes.com](https://github.com/alexamies/chinesenotes.com) corpus. For local development, check out that repo as a sibling directory:

```
../chinesenotes.com/
  data/corpus/
    collections.csv     # master list of all works (one per line, tab-separated)
    daodejing.csv       # per-book chapter index (one per work)
    lunyu.csv
    ...
```

`collections.csv` columns (tab-separated):

```
csvFile  htmlFile  title  description  introFile  corpus  language  period  genre
```

Each per-book CSV lists chapters:

```
sourcePath  htmlPath  chapterTitle
```

where `sourcePath` is of the form `bookId/chapterId.txt` — the same path used to fetch the file from the GCS bucket `chinesenotes-text`.

Chapter text files are **not** stored in git. They live in the GCS bucket `gs://chinesenotes-text` and are fetched at request time using Application Default Credentials (your local `gcloud auth application-default login` in dev; the Cloud Run service account in production).

## Project structure

```
src/
  app/
    page.tsx                        # dictionary home page
    library/
      page.tsx                      # library index (lists all works from collections.csv)
      [bookId]/
        page.tsx                    # chapter list (pre-rendered for all books at build time)
        [chapter]/
          page.tsx                  # chapter reader (ISR, fetches text from GCS at request time)
    api/lookup/route.ts             # dictionary lookup API
    entry/[term]/page.tsx           # full entry detail page
  components/
    ChapterReader.tsx               # interactive reader (click word → definition panel)
    DictionaryApp.tsx               # search input + results
    Header.tsx / HamburgerMenu.tsx  # site chrome
  lib/
    corpus.ts                       # reads collections.csv and per-book CSVs; fetches chapter
                                    # text from GCS via @google-cloud/storage
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

Grant the Cloud Run service account read access to the GCS text bucket:

```shell
gcloud storage buckets add-iam-policy-binding gs://chinesenotes-text \
  --member=serviceAccount:<SERVICE_ACCOUNT_EMAIL> \
  --role=roles/storage.objectViewer
```

Chapter pages are rendered at request time (ISR, 24-hour cache) and fetch text from `gs://chinesenotes-text` using the Cloud Run service account credentials.

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

1. `docker build` — clones the corpus CSV index files from `github.com/alexamies/chinesenotes.com` (sparse checkout of `data/corpus` only), then builds the Next.js app with `--build-arg SITE_THEME=chinesenotes`
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

### Rendering strategy

| Route | Strategy | Data source |
|---|---|---|
| `/library` | Static (build time) | `collections.csv` cloned in Dockerfile |
| `/library/[bookId]` | Static (build time) | per-book `.csv` cloned in Dockerfile |
| `/library/[bookId]/[chapter]` | ISR (24 h cache) | GCS bucket `chinesenotes-text` at request time |
| `/entry/[term]` | Static (build time) | `data/dictionary.json` |

### Why SITE_THEME is a build-time argument

Next.js pre-renders static and SSG pages at `npm run build` time. If `SITE_THEME` were only a Cloud Run runtime variable it would not be visible during the build, and pre-rendered pages would fall back to the `demo` theme. Passing it as a Docker `ARG` and `ENV` before `npm run build` ensures the theme is baked correctly into all pre-rendered library and entry pages.

## Available commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Run unit tests (Vitest) |
