#!/usr/bin/env bash

# Script to pull DeepSeek-R1 model from Hugging Face and load it into Ollama
# This script should be run after Docker Compose is up and running

set -e

# Configuration
MODEL_REPO="unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF"
MODEL_FILE="DeepSeek-R1-0528-Qwen3-8B-UD-Q4_K_XL.gguf"
OLLAMA_HOST="http://localhost:11434"
MODEL_NAME="deepseek-r1-qwen3-8b"
MODELS_DIR="./ai_stack/ollama/models"

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

# Check if Ollama is running
check_ollama() {
    log_info "Checking if Ollama is running..."
    if ! curl -f "${OLLAMA_HOST}/api/version" >/dev/null 2>&1; then
        log_error "Ollama is not running or not accessible at ${OLLAMA_HOST}"
        log_error "Please make sure Docker Compose is running with: make up"
        exit 1
    fi
    log_info "Ollama is running"
}

# Create models directory if it doesn't exist
create_models_dir() {
    if [ ! -d "${MODELS_DIR}" ]; then
        log_info "Creating models directory: ${MODELS_DIR}"
        mkdir -p "${MODELS_DIR}"
    fi
}

# Download model from Hugging Face using huggingface-hub
download_model() {
    log_info "Downloading model from Hugging Face..."
    
    # Check if huggingface-hub is installed
    if ! command -v huggingface-cli &> /dev/null; then
        log_warn "huggingface-cli not found. Installing huggingface-hub..."
        pip install huggingface-hub
    fi
    
    # Download the specific GGUF file
    log_info "Downloading ${MODEL_FILE} from ${MODEL_REPO}..."
    huggingface-cli download \
        "${MODEL_REPO}" \
        "${MODEL_FILE}" \
        --local-dir "${MODELS_DIR}" \
        --local-dir-use-symlinks False
    
    log_info "Model downloaded to ${MODELS_DIR}/${MODEL_FILE}"
}

# Create Modelfile for Ollama
create_modelfile() {
    local modelfile_path="${MODELS_DIR}/Modelfile.${MODEL_NAME}"
    
    log_info "Creating Modelfile at ${modelfile_path}"
    
    cat > "${modelfile_path}" << EOF
FROM ./${MODEL_FILE}

TEMPLATE """{{ if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}{{ if .Prompt }}<|im_start|>user
{{ .Prompt }}<|im_end|>
{{ end }}<|im_start|>assistant
{{ .Response }}<|im_end|>
"""

PARAMETER stop "<|im_start|>"
PARAMETER stop "<|im_end|>"
PARAMETER num_ctx 32768
PARAMETER num_predict 8192
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1

SYSTEM """You are DeepSeek-R1, a helpful and harmless AI assistant developed by DeepSeek. You should think step-by-step and provide detailed, accurate responses."""
EOF

    log_info "Modelfile created successfully"
}

# Load model into Ollama
load_model() {
    log_info "Loading model into Ollama..."
    
    # Change to models directory for relative path in Modelfile
    cd "${MODELS_DIR}"
    
    # Create the model in Ollama
    podman exec ollama-server ollama create "${MODEL_NAME}" -f "Modelfile.${MODEL_NAME}"
    
    # Go back to original directory
    cd - > /dev/null
    
    log_info "Model '${MODEL_NAME}' loaded successfully into Ollama"
}

# Verify model is loaded
verify_model() {
    log_info "Verifying model is available in Ollama..."
    
    if podman exec ollama-server ollama list | grep -q "${MODEL_NAME}"; then
        log_info "✅ Model '${MODEL_NAME}' is available in Ollama"
        
        # Show model details
        log_info "Model details:"
        podman exec ollama-server ollama list | grep "${MODEL_NAME}" || true
        
        log_info "You can now use the model with: ollama run ${MODEL_NAME}"
    else
        log_error "❌ Model '${MODEL_NAME}' was not found in Ollama"
        exit 1
    fi
}

# Test the model with a simple prompt
test_model() {
    log_info "Testing model with a simple prompt..."
    
    echo "Testing model response:"
    echo "Prompt: 'Hello, can you introduce yourself?'"
    echo "Response:"
    
    podman exec ollama-server ollama run "${MODEL_NAME}" "Hello, can you introduce yourself?" || {
        log_warn "Model test failed, but model is loaded. You can test it manually."
    }
}

# Main execution
main() {
    log_info "Starting DeepSeek-R1 model setup for Ollama..."
    
    check_ollama
    create_models_dir
    
    # Check if model file already exists
    if [ -f "${MODELS_DIR}/${MODEL_FILE}" ]; then
        log_warn "Model file already exists at ${MODELS_DIR}/${MODEL_FILE}"
        read -p "Do you want to re-download it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            download_model
        else
            log_info "Skipping download, using existing model file"
        fi
    else
        download_model
    fi
    
    create_modelfile
    load_model
    verify_model
    
    # Ask if user wants to test the model
    read -p "Do you want to test the model? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        test_model
    fi
    
    log_info "✅ DeepSeek-R1 model setup completed successfully!"
    log_info "You can now use the model with: podman exec ollama-server ollama run ${MODEL_NAME}"
    log_info "Or via API at: ${OLLAMA_HOST}/api/generate"
}

# Run main function
main "$@"
