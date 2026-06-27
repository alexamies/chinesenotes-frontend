FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Corpus and taisho.html are pre-cloned by the Cloud Build clone-corpus step
# and placed in the build context before docker build runs.
ARG SITE_THEME=chinesenotes
ENV SITE_THEME=$SITE_THEME

COPY active-corpus /active-corpus
COPY taisho.html /taisho.html
RUN case "$SITE_THEME" in \
      ntireader) REPO=buddhist-dictionary ;; \
      hbreader)  REPO=hbreader ;; \
      *)         REPO=chinesenotes.com ;; \
    esac && \
    mkdir -p "/${REPO}/data" && \
    ln -s /active-corpus "/${REPO}/data/corpus" && \
    case "$SITE_THEME" in \
      ntireader) \
        mkdir -p /buddhist-dictionary/html && \
        mv /taisho.html /buddhist-dictionary/html/taisho.html ;; \
      *) rm -f /taisho.html ;; \
    esac
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_GA_TAG=G-03MVHHCXJ6
ENV NEXT_PUBLIC_GA_TAG=$NEXT_PUBLIC_GA_TAG

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
