# Use Node.js 22 on Ubuntu base
FROM node:22-bookworm

# Install Python and build dependencies via apt
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    build-essential \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --omit=dev

# Install LibreTranslate (using --break-system-packages for Docker environment)
RUN pip3 install --break-system-packages libretranslate

# Copy application code
COPY . .

# Build Next.js application
RUN npm run build

# Expose port (Next.js default is 3000)
EXPOSE 3000

# Make start script executable
RUN chmod +x start.sh

# Start the application
CMD ["sh", "start.sh"]
