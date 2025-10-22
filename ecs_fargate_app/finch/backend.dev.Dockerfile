ARG PLATFORM="amd64"

FROM --platform=linux/${PLATFORM} node:alpine3.22

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

EXPOSE 3000

CMD ["npm", "run", "start:dev"]