#!/usr/bin/env bash

# Simple script to pull DeepSeek-R1 model using Ollama pull command
# This is an alternative if the model becomes available in Ollama's registry

set -e

MODEL_NAME="deepseek-r1:8b-q4"
OLLAMA_HOST="http://localhost:11434"
CONTAINER_NAME="ollama-server"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Ollama container is running
check_ollama() {
    log_info "Checking if Ollama container is running..."
    if ! docker ps | grep -q "${CONTAINER_NAME}"; then
        log_error "Ollama container '${CONTAINER_NAME}' is not running"
        log_error "Please start it with: make ollama-up"
        exit 1
    fi
    log_info "Ollama container is running"
}

# Pull model using ollama pull
pull_model() {
    log_info "Attempting to pull model: ${MODEL_NAME}"
    
    # Try to pull the model - this will work if the model is in Ollama's registry
    if docker exec "${CONTAINER_NAME}" ollama pull "${MODEL_NAME}"; then
        log_info "✅ Model '${MODEL_NAME}' pulled successfully"
    else
        log_error "❌ Failed to pull model '${MODEL_NAME}'"
        log_error "The model might not be available in Ollama's registry."
        log_error "Use the pull-deepseek-model.sh script to download from Hugging Face instead."
        exit 1
    fi
}

# Verify model is available
verify_model() {
    log_info "Verifying model is available..."
    
    if docker exec "${CONTAINER_NAME}" ollama list | grep -q "${MODEL_NAME}"; then
        log_info "✅ Model '${MODEL_NAME}' is available"
        docker exec "${CONTAINER_NAME}" ollama list | grep "${MODEL_NAME}"
    else
        log_error "❌ Model verification failed"
        exit 1
    fi
}

main() {
    log_info "Starting simple model pull for ${MODEL_NAME}..."
    
    check_ollama
    pull_model
    verify_model
    
    log_info "✅ Model setup completed!"
    log_info "You can now use: docker exec ${CONTAINER_NAME} ollama run ${MODEL_NAME}"
}

main "$@"
