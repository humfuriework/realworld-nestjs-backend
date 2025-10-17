FROM node:20-alpine AS development

RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm install

# Copy Prisma Schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Note: Source code comes from volume mounts in development
# No COPY . . needed - volume mounting handles source code
EXPOSE 3000 9229

# Development Command
CMD ["npm", "run", "start:dev"]

# Build stage
FROM node:20-alpine AS build

RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Production stage
FROM node:20.18.1-alpine3.20 AS production

RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --only=production

RUN npx prisma generate

COPY --from=build /app/dist ./dist

CMD ["node", "dist/main.js"]
