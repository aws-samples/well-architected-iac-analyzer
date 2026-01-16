# Set to "amd64" for Intel/AMD or "arm64" if Apple Silicon/ARM
ARG PLATFORM="arm64"

# dockerfile-source-not-pinned: Using version tag (alpine3.23) for maintainability. SHA256 pinning would require
# manual updates for every security patch, which is impractical for this sample project.
# avoid-platform-with-from: Intentional multi-architecture support. This project supports both Docker and Finch
# for local development across different CPU architectures (Apple Silicon/ARM vs Intel/AMD).
# The ARG PLATFORM pattern provides flexibility without requiring docker buildx.
# nosemgrep: avoid-platform-with-from, dockerfile-source-not-pinned
FROM --platform=linux/${PLATFORM} node:alpine3.23

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies including development dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Install nest CLI globally
RUN npm install -g @nestjs/cli

# Copy the rest of the application
COPY backend/ .

# Set ownership to the built-in node user (non-root)
RUN chown -R node:node /app

# Switch to non-root user (node user is built into node:alpine image)
USER node

EXPOSE 3000

# Checks if the server is responding on port 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD ["sh", "-c", "wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1"]

CMD ["npm", "run", "start:dev"]