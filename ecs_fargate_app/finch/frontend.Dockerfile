ARG PLATFORM="amd64"

# Build stage
# dockerfile-source-not-pinned: Using version tag (alpine3.23) for maintainability. SHA256 pinning would require
# manual updates for every security patch, which is impractical for this sample project.
# avoid-platform-with-from: Intentional multi-architecture support. Defaults to amd64 for AWS ECS Fargate
# deployment while allowing override for local development on different architectures.
# nosemgrep: avoid-platform-with-from, dockerfile-source-not-pinned
FROM --platform=linux/${PLATFORM} node:alpine3.23 AS build

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the application
COPY frontend/ .

# Build the application
RUN npm run build

# Deployment stage
# dockerfile-source-not-pinned: Using version tag (stable-alpine-slim) for maintainability. SHA256 pinning would
# require manual updates for every security patch, which is impractical for this sample project.
# avoid-platform-with-from: Intentional multi-architecture support. Defaults to amd64 for AWS ECS Fargate
# deployment while allowing override for local development on different architectures.
# nosemgrep: dockerfile-source-not-pinned, avoid-platform-with-from
FROM --platform=linux/${PLATFORM} nginx:stable-alpine-slim

# avoid-apk-upgrade: Security best practice. Running apk upgrade ensures the nginx container has the latest
# security patches applied, even if the base image has known vulnerabilities at publish time.
# This is a deliberate security hardening measure.
# nosemgrep: avoid-apk-upgrade
RUN apk update && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

COPY --from=build /app/public /usr/share/nginx/html

# Copy custom main nginx configuration (with non-root user settings)
COPY finch/nginx.main.conf /etc/nginx/nginx.conf

# Copy server block configuration
COPY finch/nginx.conf /etc/nginx/conf.d/default.conf

# Set up directories with proper permissions for non-root nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    # Create temp directories needed by nginx
    mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    chown -R nginx:nginx /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp

# Switch to non-root user nginx
USER nginx

EXPOSE 8080

# Add healthcheck - uses the /health endpoint defined in nginx.conf
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD ["sh", "-c", "wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1"]

CMD ["nginx", "-g", "daemon off;"]