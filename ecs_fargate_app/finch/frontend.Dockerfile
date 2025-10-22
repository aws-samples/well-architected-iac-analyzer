ARG PLATFORM="amd64"

# Build stage
FROM --platform=linux/${PLATFORM} node:alpine3.22 as build

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

# Production stage
FROM --platform=linux/${PLATFORM} nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

COPY --from=build /app/public /usr/share/nginx/html

# Copy nginx configuration
COPY finch/nginx.conf /etc/nginx/conf.d/default.conf

# Create directory for nginx pid file
RUN mkdir -p /run/nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]