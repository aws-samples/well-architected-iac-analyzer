ARG PLATFORM="amd64"

# Build stage
FROM --platform=linux/${PLATFORM} node:alpine3.22 as build

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the application
COPY backend/ .

# Build the application
RUN npm run build

# Production stage
FROM --platform=linux/${PLATFORM} node:alpine3.22

WORKDIR /app

# Copy package files and install production dependencies
COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Copy built files
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]