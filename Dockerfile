FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

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

# Corpus text files (library reader) and dictionary JSON (API lookup)
# are read from disk at request time; both must be present at runtime.
COPY --from=builder /app/corpus ./corpus
COPY --from=builder /app/data ./data

EXPOSE 3000
CMD ["node", "server.js"]
