FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with proper permissions
RUN npm ci

# Install TypeScript globally to avoid permission issues
RUN npm install -g typescript

# Copy source code
COPY . .

# Build TypeScript with the global tsc
RUN tsc

# Expose port
EXPOSE 3000

# Start the web server
CMD ["npm", "run", "web"]