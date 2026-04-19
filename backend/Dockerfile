FROM python:3.11-slim

# Install system dependencies for MOSIP and networking
# We use libgl1 instead of the obsolete libgl1-mesa-glx
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Run the server
CMD ["python", "server.py"]