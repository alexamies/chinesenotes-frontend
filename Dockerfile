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
        mv /taisho.html /buddhist-dictionary/html/taisho.html && \
        cp -r /app/buddhist-dictionary/html/taisho /buddhist-dictionary/html/taisho ;; \
      *) rm -f /taisho.html && mkdir -p /buddhist-dictionary/html ;; \
    esac
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_GA_TAG=G-03MVHHCXJ6
ENV NEXT_PUBLIC_GA_TAG=$NEXT_PUBLIC_GA_TAG

# Baked in as a build-time constant so the footer reflects the actual image
# build time, not container start time (Cloud Run cold starts would otherwise
# re-evaluate a runtime `new Date()` on every fresh instance).
RUN export NEXT_PUBLIC_BUILD_DATE="$(date -u +'%Y-%m-%d %H:%M:%S UTC')" && \
    npm run build

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

# Taisho volume/text HTML (ntireader only; empty dir for other themes) is
# read at request time by src/lib/taisho.ts, which resolves it relative to
# process.cwd() (i.e. /app here), so it must live at /buddhist-dictionary/html.
# Scoped to the html/ subtree only: the builder's /buddhist-dictionary also
# contains a data/corpus symlink (its own build-time convenience) that must
# not land on top of the real data/corpus directory assembled above.
COPY --from=builder /buddhist-dictionary/html /buddhist-dictionary/html

EXPOSE 3000
CMD ["node", "server.js"]
