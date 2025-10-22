ARG PLATFORM="amd64"

FROM --platform=linux/${PLATFORM} node:alpine3.22

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

# Just run the Vite dev server
CMD ["npm", "run", "dev"]