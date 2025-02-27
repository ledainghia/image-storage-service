# Use Node.js LTS version as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Create necessary directories
RUN mkdir -p uploads data

# Build TypeScript code
RUN npm run build

# Expose the application port
EXPOSE 3003

# Set environment variables
ENV PORT=3003
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]