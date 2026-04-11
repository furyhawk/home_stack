#!/usr/bin/env bash

# AI Stack Launcher - Choose your AI backend
# This script helps users choose between Ollama and LlamaCPP for DeepSeek-R1

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored output
print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}     AI Stack DeepSeek-R1       ${NC}"
    echo -e "${CYAN}================================${NC}"
    echo
}

print_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_option() {
    echo -e "${BLUE}$1${NC} $2"
}

# Check if GPU is available
check_gpu() {
    if command -v nvidia-smi &> /dev/null && nvidia-smi &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Display system information
show_system_info() {
    echo -e "${PURPLE}System Information:${NC}"
    echo "  CPU: $(nproc) cores"
    echo "  RAM: $(free -h | awk '/^Mem:/ {print $2}')"
    
    if check_gpu; then
        echo "  GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)"
        echo "  VRAM: $(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -1) MB"
    else
        echo "  GPU: Not available"
    fi
    echo
}

# Show backend options
show_options() {
    echo -e "${PURPLE}Available Backends:${NC}"
    echo
    
    print_option "1)" "Ollama (Recommended for beginners)"
    echo "     • Easy to use and manage"
    echo "     • Web UI available"
    echo "     • Good performance"
    echo "     • Port: 11434"
    echo
    
    print_option "2)" "LlamaCPP (CPU-only)"
    echo "     • Direct GGUF model loading"
    echo "     • Lightweight and fast"
    echo "     • OpenAI-compatible API"
    echo "     • Port: 8080"
    echo
    
    if check_gpu; then
        print_option "3)" "LlamaCPP (GPU-accelerated)"
        echo "     • CUDA-optimized performance"
        echo "     • Best speed and efficiency"
        echo "     • Requires NVIDIA GPU"
        echo "     • Port: 8080"
        echo
    fi
    
    print_option "0)" "Exit"
    echo
}

# Launch Ollama
launch_ollama() {
    print_info "Launching Ollama with DeepSeek-R1..."
    echo
    
    print_info "Starting Ollama container..."
    make ollama-up
    
    echo
    print_info "Downloading and loading DeepSeek-R1 model..."
    make pull-deepseek-model
    
    echo
    print_info "✅ Ollama setup complete!"
    echo "   🌐 Access at: http://localhost:11434"
    echo "   📚 Model: deepseek-r1-qwen3-8b"
    echo "   💬 Chat: docker exec ollama-server ollama run deepseek-r1-qwen3-8b"
}

# Launch LlamaCPP CPU
launch_llamacpp_cpu() {
    print_info "Launching LlamaCPP (CPU) with DeepSeek-R1..."
    echo
    
    print_info "Starting LlamaCPP container..."
    make llamacpp-up
    
    echo
    print_info "Downloading DeepSeek-R1 model..."
    make pull-deepseek-llamacpp
    
    echo
    print_info "✅ LlamaCPP (CPU) setup complete!"
    echo "   🌐 Web UI: http://localhost:8080"
    echo "   📡 API: http://localhost:8080/completion"
    echo "   📊 Health: http://localhost:8080/health"
}

# Launch LlamaCPP GPU
launch_llamacpp_gpu() {
    print_info "Launching LlamaCPP (GPU) with DeepSeek-R1..."
    echo
    
    print_info "Downloading model if needed..."
    make pull-deepseek-llamacpp
    
    echo
    print_info "Starting GPU-accelerated LlamaCPP..."
    make llamacpp-gpu
    
    echo
    print_info "✅ LlamaCPP (GPU) setup complete!"
    echo "   🌐 Web UI: http://localhost:8080"
    echo "   📡 API: http://localhost:8080/completion"
    echo "   📊 Health: http://localhost:8080/health"
    echo "   🚀 GPU-accelerated for best performance!"
}

# Test the selected backend
test_backend() {
    local backend=$1
    
    echo
    print_info "Would you like to test the ${backend} backend? (y/N)"
    read -r response
    
    if [[ $response =~ ^[Yy]$ ]]; then
        echo
        print_info "Testing ${backend}..."
        
        case $backend in
            "Ollama")
                if docker exec ollama-server ollama run deepseek-r1-qwen3-8b "Hello, introduce yourself briefly" 2>/dev/null; then
                    print_info "✅ Ollama test successful!"
                else
                    print_warn "⚠️  Test failed, but server should be running"
                fi
                ;;
            "LlamaCPP")
                sleep 5  # Give server time to start
                if curl -s -X POST http://localhost:8080/completion \
                    -H "Content-Type: application/json" \
                    -d '{"prompt": "Hello!", "max_tokens": 20}' | grep -q "content"; then
                    print_info "✅ LlamaCPP test successful!"
                else
                    print_warn "⚠️  Test failed, server might still be starting up"
                fi
                ;;
        esac
    fi
}

# Show management commands
show_management() {
    echo
    echo -e "${PURPLE}Management Commands:${NC}"
    echo "  make help                 # Show all available commands"
    echo "  make ollama-logs          # View Ollama logs"
    echo "  make llamacpp-logs        # View LlamaCPP logs"
    echo "  make ollama-down          # Stop Ollama"
    echo "  make llamacpp-down        # Stop LlamaCPP"
    echo "  docker ps                 # See running containers"
    echo
}

# Main menu
main_menu() {
    print_header
    show_system_info
    show_options
    
    echo -n "Choose your AI backend (1-3, 0 to exit): "
    read -r choice
    
    case $choice in
        1)
            launch_ollama
            test_backend "Ollama"
            ;;
        2)
            launch_llamacpp_cpu
            test_backend "LlamaCPP"
            ;;
        3)
            if check_gpu; then
                launch_llamacpp_gpu
                test_backend "LlamaCPP GPU"
            else
                print_error "GPU not available! Please choose option 1 or 2."
                return 1
            fi
            ;;
        0)
            print_info "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            return 1
            ;;
    esac
    
    show_management
    print_info "🎉 Setup complete! Your AI backend is ready to use."
}

# Run main menu
main_menu
