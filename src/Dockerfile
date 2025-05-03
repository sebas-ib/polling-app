FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/*.css ./
COPY --from=builder /app/*.ico ./

RUN npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
