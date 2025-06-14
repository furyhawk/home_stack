# Use Ubuntu as base image for better compatibility with Ollama
FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV OLLAMA_HOST=0.0.0.0

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Create ollama user and directories
RUN useradd -r -s /bin/false -m -d /usr/share/ollama ollama && \
    mkdir -p /usr/share/ollama/.ollama && \
    chown -R ollama:ollama /usr/share/ollama

# Create directory for models
RUN mkdir -p /models && chown -R ollama:ollama /models

# Switch to ollama user
USER ollama

# Set working directory
WORKDIR /usr/share/ollama

# Expose the default Ollama port
EXPOSE 11434

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:11434/api/version || exit 1

# Start Ollama server
CMD ["ollama", "serve"]
