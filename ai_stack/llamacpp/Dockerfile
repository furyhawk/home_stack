FROM ubuntu:latest

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    cmake \
    g++ \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Clone llama.cpp
RUN git clone https://github.com/ggerganov/llama.cpp.git

# Build llama.cpp with server support
WORKDIR /llama.cpp
RUN mkdir build && cd build && cmake .. -DLLAMA_SERVER=ON && make -j$(nproc)

# Create models directory
RUN mkdir -p /models

# Expose the server port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Default command - will be overridden by docker-compose
CMD ["/llama.cpp/llama-server", "--host", "0.0.0.0", "--port", "8080"]