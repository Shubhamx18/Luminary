<<<<<<< HEAD
# ============================================
# Stage 1: Build the React/Vite application
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./
=======
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
>>>>>>> b02e1a7 (updating luminary)
RUN npm ci

# Copy source code
COPY . .

<<<<<<< HEAD
# Build-time env vars (baked into the JS bundle by Vite)
ARG VITE_API_URL
ARG VITE_BACKEND_URL
ARG VITE_SOCKET_URL
ARG VITE_AGORA_APP_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_AGORA_APP_ID=$VITE_AGORA_APP_ID

# Build production bundle
RUN npm run build

# ============================================
# Stage 2: Serve with nginx
# ============================================
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

=======
# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration to correct location
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
>>>>>>> b02e1a7 (updating luminary)
CMD ["nginx", "-g", "daemon off;"]
