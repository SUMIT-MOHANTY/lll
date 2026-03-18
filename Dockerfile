FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create log directory
RUN mkdir -p logs

# Expose the application port
EXPOSE 3000

# Use PM2 for process management
RUN npm install pm2 -g

# Start the application with PM2 in cluster mode
CMD ["pm2-runtime", "start", "backend/server.js", "--name", "passport-api", "-i", "2", "--no-daemon"]
