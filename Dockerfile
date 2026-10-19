# Digest pinned so builds are reproducible; Dependabot (docker ecosystem) bumps it.
FROM node:26-alpine@sha256:6f08a523443ddedf52941874c203475b0ad503e859ad70cb26ab8be9a517dbd5 AS builder
WORKDIR /app
# .npmrc must be present before install so min-release-age/ignore-scripts/engine-strict apply to the build too.
COPY package*.json .npmrc ./
RUN npm ci
RUN npm run rebuild:approved
COPY . .
RUN npm run build

FROM node:26-alpine@sha256:6f08a523443ddedf52941874c203475b0ad503e859ad70cb26ab8be9a517dbd5
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json .npmrc ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
EXPOSE 3002
USER node
# node fetch instead of curl/wget: no extra binary in the image. Coolify gates deploys on this.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3002)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--import", "./dist-server/telemetry.js", "dist-server/index.js"]
