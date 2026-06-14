FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Sparse-clone the corpus CSV index files from chinesenotes.com.
# Only data/corpus is fetched; the large text files live in GCS, not git.
# Cloning to /chinesenotes.com mirrors the local sibling-directory layout
# that corpus.ts expects (process.cwd()/../chinesenotes.com/data/corpus).
RUN apk add --no-cache git && \
    git clone --depth=1 --filter=blob:none --sparse \
      https://github.com/alexamies/chinesenotes.com.git /chinesenotes.com && \
    git -C /chinesenotes.com sparse-checkout set data/corpus

# SITE_THEME is baked into statically pre-rendered pages at build time.
# Pass via --build-arg so each site's image has the correct theme.
ARG SITE_THEME=demo
ENV SITE_THEME=$SITE_THEME

RUN npm run build

# ---- runtime image ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone output bundles server + dependencies into .next/standalone/
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Corpus CSV index files are read at request time for library and book pages.
# Placed at /chinesenotes.com/data/corpus to match the path corpus.ts resolves.
COPY --from=builder /chinesenotes.com/data/corpus /chinesenotes.com/data/corpus

# Dictionary data for the API lookup endpoint.
COPY --from=builder /app/data ./data

EXPOSE 3000
CMD ["node", "server.js"]
