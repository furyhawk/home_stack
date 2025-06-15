#!/usr/bin/env bash

# Script to pull DeepSeek-R1 model from Hugging Face for LlamaCPP
# This script downloads the model and prepares it for LlamaCPP server

set -e

# Configuration
MODEL_REPO="unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF"
MODEL_FILE="DeepSeek-R1-0528-Qwen3-8B-UD-Q4_K_XL.gguf"
MODELS_DIR="./ai_stack/llamacpp/models"
LLAMACPP_HOST="http://localhost:8080"
CONTAINER_NAME="llama-cpp-server"

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

# Create models directory if it doesn't exist
create_models_dir() {
    if [ ! -d "${MODELS_DIR}" ]; then
        log_info "Creating models directory: ${MODELS_DIR}"
        mkdir -p "${MODELS_DIR}"
    fi
}

# Install huggingface-hub using the best available package manager
install_huggingface_hub() {
    # First try pipx if available (best for externally managed Python environments)
    if command -v pipx &> /dev/null; then
        log_info "Installing huggingface-hub using pipx..."
        pipx install huggingface-hub && return 0
    fi
    
    # Try uv with virtual environment
    if command -v uv &> /dev/null; then
        log_info "Installing huggingface-hub using uv..."
        # Create a temporary virtual environment for the installation
        local temp_venv="/tmp/huggingface_venv_$$"
        uv venv "$temp_venv" &> /dev/null && {
            log_info "Created temporary virtual environment for huggingface-hub..."
            source "$temp_venv/bin/activate"
            uv pip install huggingface-hub && {
                # Add the venv bin to PATH for this session
                export PATH="$temp_venv/bin:$PATH"
                log_info "huggingface-hub installed in temporary virtual environment"
                return 0
            }
            deactivate 2>/dev/null || true
        }
        
        # If virtual environment approach fails, try system install
        log_warn "Virtual environment approach failed, trying system install..."
        uv pip install --system huggingface-hub 2>/dev/null && return 0
    fi
    
    # Fall back to other methods
    install_with_fallback
}

# Fallback installation method
install_with_fallback() {
    # Try to create a virtual environment with python3 -m venv
    if command -v python3 &> /dev/null; then
        log_info "Trying to install huggingface-hub using python3 with virtual environment..."
        local temp_venv="/tmp/huggingface_venv_$$"
        python3 -m venv "$temp_venv" 2>/dev/null && {
            source "$temp_venv/bin/activate"
            python3 -m pip install huggingface-hub && {
                # Add the venv bin to PATH for this session
                export PATH="$temp_venv/bin:$PATH"
                log_info "huggingface-hub installed in temporary virtual environment"
                return 0
            }
            deactivate 2>/dev/null || true
        }
        
        # Try --break-system-packages as last resort (for some systems)
        log_warn "Virtual environment failed, trying with --break-system-packages..."
        python3 -m pip install --break-system-packages huggingface-hub 2>/dev/null && return 0
    fi
    
    # Final fallback attempts
    if command -v pip3 &> /dev/null; then
        log_info "Trying pip3 with --break-system-packages..."
        pip3 install --break-system-packages huggingface-hub 2>/dev/null && return 0
    fi
    
    if command -v pip &> /dev/null; then
        log_info "Trying pip with --break-system-packages..."
        pip install --break-system-packages huggingface-hub 2>/dev/null && return 0
    fi
    
    # If all else fails, provide helpful error message
    log_error "Failed to install huggingface-hub automatically."
    log_error "Your system has an externally managed Python environment."
    log_error ""
    log_error "Please install huggingface-hub manually using one of these methods:"
    log_error "  1. Using pipx (recommended):"
    log_error "     sudo apt install pipx  # or your package manager"
    log_error "     pipx install huggingface-hub"
    log_error ""
    log_error "  2. Using your system package manager:"
    log_error "     sudo apt install python3-huggingface-hub  # if available"
    log_error ""
    log_error "  3. Using a virtual environment:"
    log_error "     python3 -m venv ~/.local/huggingface_env"
    log_error "     source ~/.local/huggingface_env/bin/activate"
    log_error "     pip install huggingface-hub"
    log_error "     # Then add ~/.local/huggingface_env/bin to your PATH"
    log_error ""
    log_error "  4. Force install (not recommended):"
    log_error "     python3 -m pip install --break-system-packages huggingface-hub"
    exit 1
}

# Download model from Hugging Face
download_model() {
    log_info "Downloading model from Hugging Face..."
    
    # Check if huggingface-hub is installed
    if ! command -v huggingface-cli &> /dev/null; then
        log_warn "huggingface-cli not found. Installing huggingface-hub..."
        install_huggingface_hub
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

# Verify model file exists and get info
verify_model() {
    local model_path="${MODELS_DIR}/${MODEL_FILE}"
    
    if [ ! -f "${model_path}" ]; then
        log_error "Model file not found at ${model_path}"
        exit 1
    fi
    
    local file_size=$(du -h "${model_path}" | cut -f1)
    log_info "✅ Model file verified: ${model_path} (${file_size})"
}

# Check if LlamaCPP container is running
check_llamacpp() {
    log_info "Checking if LlamaCPP container is running..."
    if docker ps | grep -q "${CONTAINER_NAME}"; then
        log_info "LlamaCPP container is running"
        
        # Test if server is responding
        if curl -f "${LLAMACPP_HOST}/health" >/dev/null 2>&1; then
            log_info "LlamaCPP server is responding"
            return 0
        else
            log_warn "LlamaCPP container is running but server is not responding"
            return 1
        fi
    else
        log_warn "LlamaCPP container is not running"
        return 1
    fi
}

# Test the model with a simple prompt
test_model() {
    log_info "Testing model with a simple prompt..."
    
    local prompt="Hello, can you introduce yourself?"
    log_info "Sending test prompt: '${prompt}'"
    
    # Test via API
    curl -s -X POST "${LLAMACPP_HOST}/completion" \
        -H "Content-Type: application/json" \
        -d "{
            \"prompt\": \"${prompt}\",
            \"max_tokens\": 100,
            \"temperature\": 0.7,
            \"stop\": [\"\\n\\n\"]
        }" | jq -r '.content' 2>/dev/null || {
        log_warn "Model test failed or jq not available. Server might still be starting up."
        log_info "You can test manually at: ${LLAMACPP_HOST}"
    }
}

# Display usage information
show_usage() {
    log_info "Model setup completed! Here's how to use it:"
    echo
    echo "🌐 Web Interface: ${LLAMACPP_HOST}"
    echo "📡 API Endpoint: ${LLAMACPP_HOST}/completion"
    echo
    echo "Example API call:"
    echo "curl -X POST ${LLAMACPP_HOST}/completion \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"prompt\": \"Hello!\", \"max_tokens\": 50}'"
    echo
    echo "Container management:"
    echo "  Start: make llamacpp-up"
    echo "  Stop:  make llamacpp-down"
    echo "  Logs:  make llamacpp-logs"
}

# Main execution
main() {
    log_info "Starting DeepSeek-R1 model setup for LlamaCPP..."
    
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
    
    verify_model
    
    # Check if container is running and offer to test
    if check_llamacpp; then
        read -p "LlamaCPP server is running. Do you want to test the model? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            test_model
        fi
    else
        log_info "LlamaCPP container is not running. Start it with: make llamacpp-up"
    fi
    
    show_usage
    log_info "✅ DeepSeek-R1 model setup completed successfully!"
}

# Run main function
main "$@"
