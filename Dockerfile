FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --include=optional
RUN npm run rebuild:approved
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json .npmrc ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
EXPOSE 3002
USER node
CMD ["node", "dist-server/index.js"]
