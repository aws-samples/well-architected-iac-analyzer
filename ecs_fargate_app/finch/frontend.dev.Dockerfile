# checkov:skip=CKV_DOCKER_3:Development container running locally with mounted volumes. Non-root user would cause permission issues with volume mounts. Non-local deployment uses ECS Fargate with task-level isolation.
# Set to "amd64" for Intel/AMD or "arm64" if Apple Silicon/ARM
ARG PLATFORM="arm64"

# dockerfile-source-not-pinned: Using version tag (alpine3.23) for maintainability. SHA256 pinning would require
# manual updates for every security patch, which is impractical for this sample project.
# avoid-platform-with-from: Intentional multi-architecture support. This project supports both Docker and Finch
# for local development across different CPU architectures (Apple Silicon/ARM vs Intel/AMD).
# nosemgrep: dockerfile-source-not-pinned, avoid-platform-with-from
FROM --platform=linux/${PLATFORM} node:alpine3.23

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the application
COPY frontend/ .

# Only for local dev usage. Symbolic link from from /app/public to /app/public/public
# This allows files to be accessed both as /file.ext and /public/file.ext
RUN ln -s /app/public /app/public/public

EXPOSE 8080

# Checks if Vite dev server is responding on port 8080
# nosemgrep: missing-user
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD ["sh", "-c", "wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1"]

# Just run the Vite dev server
# nosemgrep: missing-user
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]