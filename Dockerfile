# Multi-stage build for full-stack application
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files for both backend and frontend
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies for both
RUN npm ci
RUN cd backend && npm ci
RUN cd frontend && npm ci

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend dependencies and source
COPY --from=base /app/backend ./backend
COPY --from=base /app/node_modules ./node_modules

# Copy frontend built files
COPY --from=base /app/frontend/dist ./frontend/dist

# Copy package.json for scripts
COPY package*.json ./

# Expose ports
EXPOSE 3002 3000

# Create startup script
RUN echo '#!/bin/sh\n\
echo "🚀 Starting cCOP Onramp Application..."\n\
echo "🔧 Starting Backend on port 3002..."\n\
cd backend && node server.js &\n\
echo "🚀 Starting Frontend on port 3000..."\n\
cd frontend && npx serve -s dist -l 3000 &\n\
echo "✅ Both services started. Waiting..."\n\
wait' > /start.sh && chmod +x /start.sh

# Start both services
CMD ["/start.sh"]
