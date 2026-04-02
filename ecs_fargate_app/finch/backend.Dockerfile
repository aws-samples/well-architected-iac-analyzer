ARG PLATFORM="amd64"

# Build stage
# avoid-platform-with-from: Intentional multi-architecture support. Defaults to amd64 for AWS ECS Fargate
# deployment while allowing override for local development on different architectures.
# dockerfile-source-not-pinned: Using version tag (alpine3.23) for maintainability. SHA256 pinning would require
# manual updates for every security patch, which is impractical for this sample project.
# nosemgrep: dockerfile-source-not-pinned, avoid-platform-with-from
FROM --platform=linux/${PLATFORM} node:alpine3.23 AS build

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

# Deployment stage
# avoid-platform-with-from: Intentional multi-architecture support. Defaults to amd64 for AWS ECS Fargate
# deployment while allowing override for local development on different architectures.
# dockerfile-source-not-pinned: Using version tag (alpine3.23) for maintainability. SHA256 pinning would require
# manual updates for every security patch, which is impractical for this sample project.
# nosemgrep: dockerfile-source-not-pinned, avoid-platform-with-from
FROM --platform=linux/${PLATFORM} node:alpine3.23

WORKDIR /app

# avoid-apk-upgrade: Security best practice. Running apk upgrade ensures the alpine container has the latest
# security patches applied, even if the base image has known vulnerabilities at publish time.
# nosemgrep: avoid-apk-upgrade
RUN apk update && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Copy package files and install Deployment dependencies
COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Copy built files
COPY --from=build /app/dist ./dist

# Set ownership to the built-in node user (non-root)
RUN chown -R node:node /app

# Switch to non-root user (node user is built into node:alpine image)
USER node

EXPOSE 3000

# Checks if the server is responding on port 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD ["sh", "-c", "wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1"]

CMD ["node", "dist/main"]