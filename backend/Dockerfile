# Backend Dockerfile for Cloud Run
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# Expose port (Cloud Run uses PORT env var)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]

