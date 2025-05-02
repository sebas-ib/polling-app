FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy the entire frontend code into /app
COPY ./src/app ./src/app
COPY tsconfig.json ./

# Build inside the app directory
WORKDIR /app/src/app
RUN npm run build

# Runtime container
FROM node:18-alpine AS runner
WORKDIR /app

# Copy build output
COPY --from=builder /app/src/app/.next ./.next
COPY --from=builder /app/src/app/public ./public
COPY package*.json ./
RUN npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
