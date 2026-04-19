# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build 

# Stage 2: Final Backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y git build-essential libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/ .

# Copy the built React app from the builder stage
# (This assumes Vite puts files in 'dist')
COPY --from=frontend-builder /frontend/dist /app/dist

# Expose the API port
EXPOSE 8000

CMD ["python", "server.py"]