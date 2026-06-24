FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Sparse-clone the corpus CSV index files for the selected SITE_THEME.
# Only data/corpus is fetched; the large text files live in GCS, not git.
# SITE_THEME and NEXT_PUBLIC_RECAPTCHA_SITE_KEY are baked into statically
# pre-rendered pages at build time. Pass via --build-arg.
ARG SITE_THEME=chinesenotes
ENV SITE_THEME=$SITE_THEME

RUN apk add --no-cache git && \
    case "$SITE_THEME" in \
      ntireader) REPO=buddhist-dictionary ;; \
      hbreader) REPO=hbreader ;; \
      *) REPO=chinesenotes.com ;; \
    esac && \
    git clone --depth=1 --filter=blob:none --sparse \
      "https://github.com/alexamies/${REPO}.git" "/${REPO}" && \
    case "$SITE_THEME" in \
      ntireader) \
        git -C "/${REPO}" sparse-checkout set data/corpus html/taisho && \
        git -C "/${REPO}" checkout HEAD -- html/taisho.html ;; \
      *) git -C "/${REPO}" sparse-checkout set data/corpus ;; \
    esac && \
    cp -rp "/${REPO}/data/corpus" /active-corpus
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY

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
# Place them at the path corpus.ts resolves for the active SITE_THEME.
ARG SITE_THEME=chinesenotes
COPY --from=builder /active-corpus /active-corpus
RUN case "$SITE_THEME" in \
      ntireader) REPO=buddhist-dictionary ;; \
      hbreader) REPO=hbreader ;; \
      *) REPO=chinesenotes.com ;; \
    esac && \
    mkdir -p "/${REPO}/data" && \
    mv /active-corpus "/${REPO}/data/corpus"

# Dictionary data for the API lookup endpoint.
COPY --from=builder /app/data ./data

EXPOSE 3000
CMD ["node", "server.js"]
