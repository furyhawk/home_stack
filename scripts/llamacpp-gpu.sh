#!/usr/bin/env bash

# Script to start LlamaCPP with GPU support for DeepSeek-R1 model
# This script enables CUDA/GPU acceleration for better performance

set -e

# Configuration
MODEL_FILE="DeepSeek-R1-0528-Qwen3-8B-UD-Q4_K_XL.gguf"
MODELS_DIR="./ai_stack/llamacpp/models"
CONTAINER_NAME="llama-cpp-server-gpu"
HOST_PORT="8080"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if NVIDIA GPU is available
check_gpu() {
    log_info "Checking for NVIDIA GPU..."
    
    if command -v nvidia-smi &> /dev/null; then
        if nvidia-smi &> /dev/null; then
            log_info "✅ NVIDIA GPU detected:"
            nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits
            return 0
        else
            log_warn "nvidia-smi found but failed to query GPU"
            return 1
        fi
    else
        log_warn "nvidia-smi not found - no NVIDIA GPU support"
        return 1
    fi
}

# Check if model exists
check_model() {
    local model_path="${MODELS_DIR}/${MODEL_FILE}"
    
    if [ ! -f "${model_path}" ]; then
        log_error "Model file not found at ${model_path}"
        log_error "Please run: make pull-deepseek-llamacpp"
        exit 1
    fi
    
    log_info "✅ Model file found: ${model_path}"
}

# Stop existing container if running
stop_existing() {
    if docker ps -q -f name="${CONTAINER_NAME}" | grep -q .; then
        log_info "Stopping existing container: ${CONTAINER_NAME}"
        docker stop "${CONTAINER_NAME}"
        docker rm "${CONTAINER_NAME}"
    fi
}

# Start LlamaCPP with GPU support
start_gpu_server() {
    log_info "Starting LlamaCPP server with GPU acceleration..."
    
    # Create absolute path for models directory
    local abs_models_dir=$(realpath "${MODELS_DIR}")
    
    docker run -d \
        --name "${CONTAINER_NAME}" \
        --gpus all \
        -p "${HOST_PORT}:8080" \
        -v "${abs_models_dir}:/models" \
        -e CUDA_VISIBLE_DEVICES=0 \
        llama-cpp-cuda:latest \
        /llama.cpp/llama-server \
        --model "/models/${MODEL_FILE}" \
        --host "0.0.0.0" \
        --port "8080" \
        --ctx-size "32768" \
        --n-predict "2048" \
        --threads "4" \
        --batch-size "512" \
        --n-gpu-layers "35" \
        --cont-batching \
        --parallel "4" \
        --flash-attn \
        --temperature "0.7" \
        --top-p "0.9" \
        --top-k "40" \
        --repeat-penalty "1.1"
    
    log_info "LlamaCPP GPU server started on port ${HOST_PORT}"
}

# Build GPU-enabled image if needed
build_gpu_image() {
    log_info "Checking for GPU-enabled LlamaCPP image..."
    
    if ! docker images | grep -q "llama-cpp-cuda"; then
        log_info "Building GPU-enabled LlamaCPP image..."
        
        # Create temporary Dockerfile for GPU build
        cat > /tmp/Dockerfile.llamacpp-gpu << 'EOF'
FROM nvidia/cuda:12.1-devel-ubuntu22.04

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

# Build llama.cpp with CUDA support
WORKDIR /llama.cpp
RUN mkdir build && cd build && \
    cmake .. -DLLAMA_SERVER=ON -DLLAMA_CUDA=ON && \
    make -j$(nproc)

# Create models directory
RUN mkdir -p /models

# Expose the server port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Default command
CMD ["/llama.cpp/llama-server", "--host", "0.0.0.0", "--port", "8080"]
EOF

        docker build -f /tmp/Dockerfile.llamacpp-gpu -t llama-cpp-cuda:latest .
        rm /tmp/Dockerfile.llamacpp-gpu
        
        log_info "✅ GPU-enabled image built successfully"
    else
        log_info "✅ GPU-enabled image already exists"
    fi
}

# Wait for server to be ready
wait_for_server() {
    log_info "Waiting for server to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:${HOST_PORT}/health" >/dev/null 2>&1; then
            log_info "✅ Server is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    log_error "❌ Server failed to start within expected time"
    return 1
}

# Show usage information
show_usage() {
    log_info "GPU-accelerated LlamaCPP server is running!"
    echo
    echo "🌐 Web Interface: http://localhost:${HOST_PORT}"
    echo "📡 API Endpoint: http://localhost:${HOST_PORT}/completion"
    echo "🔍 Health Check: http://localhost:${HOST_PORT}/health"
    echo "📊 Metrics: http://localhost:${HOST_PORT}/metrics"
    echo
    echo "Container: ${CONTAINER_NAME}"
    echo "GPU Layers: 35 (adjust based on your GPU memory)"
    echo
    echo "Management commands:"
    echo "  docker logs ${CONTAINER_NAME}     # View logs"
    echo "  docker stop ${CONTAINER_NAME}     # Stop server"
    echo "  docker stats ${CONTAINER_NAME}    # View resource usage"
}

# Main execution
main() {
    log_info "Starting GPU-accelerated LlamaCPP setup for DeepSeek-R1..."
    
    # Check prerequisites
    if ! check_gpu; then
        log_error "No GPU support detected. Use regular LlamaCPP setup instead."
        log_error "Run: make llamacpp-up"
        exit 1
    fi
    
    check_model
    stop_existing
    build_gpu_image
    start_gpu_server
    
    if wait_for_server; then
        show_usage
        log_info "✅ GPU-accelerated DeepSeek-R1 setup completed successfully!"
    else
        log_error "❌ Server setup failed. Check logs: docker logs ${CONTAINER_NAME}"
        exit 1
    fi
}

# Run main function
main "$@"
