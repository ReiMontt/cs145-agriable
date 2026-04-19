# Use Node.js for building
FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose Vite's default port
EXPOSE 5173

# Run Vite with --host to allow external access (essential for Docker)
CMD ["npm", "run", "dev", "--", "--host"]