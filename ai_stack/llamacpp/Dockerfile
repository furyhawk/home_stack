FROM ubuntu:latest

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    cmake \
    g++ \
    wget \
    curl \
    libcurl4-openssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Clone llama.cpp
RUN git clone https://github.com/ggerganov/llama.cpp.git

# Build llama.cpp with server support
WORKDIR /llama.cpp
RUN mkdir build && cd build && cmake .. -DLLAMA_SERVER=ON && make -j$(nproc)

# Copy the built executable to a standard location
RUN cp /llama.cpp/build/bin/llama-server /usr/local/bin/llama-server || \
    cp /llama.cpp/build/llama-server /usr/local/bin/llama-server || \
    find /llama.cpp -name "llama-server" -type f -executable -exec cp {} /usr/local/bin/llama-server \;

# Create models directory
RUN mkdir -p /models

# Expose the server port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Default command - will be overridden by docker-compose
CMD ["llama-server", "--host", "0.0.0.0", "--port", "8080"]