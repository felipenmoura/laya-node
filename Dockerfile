# Use a Python base image because AI models require heavy Python dependencies
FROM python:3.10-slim

# Install Node.js (required for the wrapper)
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pnpm && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package configurations
COPY package.json pnpm-lock.yaml* ./

# Install node dependencies
# (The postinstall script automatically skips the interactive python setup in Docker)
RUN pnpm install

# Copy application files
COPY . .

# Explicitly setup the python virtual environment inside the container
RUN python -m venv venv && \
    ./venv/bin/pip install --no-cache-dir fastapi uvicorn laya

# Pre-download the Laya model weights during the docker build to save time on container startup
RUN ./venv/bin/python -c "import warnings; warnings.filterwarnings('ignore'); from laya import Router; Router(preload=True)"

# Set environment variables
ENV PORT=4000
ENV MAX_LEN=8192
ENV SECRET_API_KEY=""

# Expose the API port
EXPOSE 4000

# Start the Node wrapper
CMD ["pnpm", "start"]
