# LlamaCPP Model Setup

Scripts and configuration for running DeepSeek-R1-0528-Qwen3-8B model with LlamaCPP server.

## Available Scripts

### 1. `pull-deepseek-llamacpp.sh`
Downloads the DeepSeek-R1 GGUF model from Hugging Face and prepares it for LlamaCPP.

**Features:**
- Downloads the Q4_K_XL quantized version (optimal balance of quality and size)
- Verifies download integrity
- Tests server connectivity
- Provides usage examples

**Usage:**
```bash
# Using Makefile (recommended)
make setup-llamacpp         # Start LlamaCPP and pull model automatically
make pull-deepseek-llamacpp # Pull model only (requires server running)

# Or run directly
./scripts/pull-deepseek-llamacpp.sh
```

### 2. `llamacpp-gpu.sh`
Starts GPU-accelerated LlamaCPP server with CUDA support for better performance.

**Features:**
- Automatic GPU detection
- CUDA-optimized build
- GPU layer offloading (35 layers for 8B model)
- Enhanced performance parameters

**Usage:**
```bash
make llamacpp-gpu           # Start GPU-accelerated server
```

## Makefile Targets

### Basic Operations
- `make llamacpp-up` - Start LlamaCPP container
- `make llamacpp-down` - Stop LlamaCPP container
- `make llamacpp-logs` - View container logs
- `make pull-deepseek-llamacpp` - Download DeepSeek model
- `make setup-llamacpp` - Complete setup (start + pull model)

### GPU Operations
- `make llamacpp-gpu` - Start GPU-accelerated server

## Model Information

**DeepSeek-R1-0528-Qwen3-8B-GGUF**
- **Source:** [unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF](https://huggingface.co/unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF)
- **Quantization:** Q4_K_XL (4-bit quantization, extra large)
- **Size:** ~5.5GB
- **Context Length:** 32,768 tokens
- **Performance:** Optimized for reasoning and conversation

## Server Configuration

### Default Parameters
- **Host:** 0.0.0.0 (accessible externally)
- **Port:** 8080
- **Context Size:** 32,768 tokens
- **Max Predict:** 2,048 tokens
- **Batch Size:** 512
- **Parallel Requests:** 2 (4 for GPU)
- **Temperature:** 0.7
- **Top-P:** 0.9
- **Top-K:** 40

### GPU Configuration
- **GPU Layers:** 35 (automatically offloaded to GPU)
- **CUDA Support:** Enabled
- **Flash Attention:** Enabled
- **Parallel Requests:** 4

## Quick Start

### CPU-Only Setup
```bash
# 1. Start LlamaCPP and download model
make setup-llamacpp

# 2. Test the server
curl http://localhost:8080/health
```

### GPU-Accelerated Setup
```bash
# 1. Ensure model is downloaded
make pull-deepseek-llamacpp

# 2. Start GPU server
make llamacpp-gpu

# 3. Verify GPU usage
nvidia-smi
```

## API Usage

### Health Check
```bash
curl http://localhost:8080/health
```

### Text Completion
```bash
curl -X POST http://localhost:8080/completion \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, can you explain quantum computing?",
    "max_tokens": 200,
    "temperature": 0.7,
    "stream": false
  }'
```

### Streaming Completion
```bash
curl -X POST http://localhost:8080/completion \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a Python function to sort a list:",
    "max_tokens": 150,
    "stream": true
  }'
```

### Chat Completion (OpenAI-compatible)
```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "DeepSeek-R1",
    "messages": [
      {"role": "user", "content": "Explain machine learning in simple terms"}
    ],
    "max_tokens": 200,
    "temperature": 0.7
  }'
```

## Performance Optimization

### CPU Optimization
- **Threads:** Adjust based on CPU cores (default: 4)
- **Batch Size:** Increase for better throughput (512-1024)
- **Context Size:** Reduce if memory is limited

### GPU Optimization
- **GPU Layers:** Increase if you have more VRAM (max: 35 for 8B model)
- **Batch Size:** Increase for GPU (1024-2048)
- **Parallel Requests:** Increase based on VRAM capacity

### Memory Requirements
- **CPU Only:** ~8GB RAM minimum, 16GB recommended
- **GPU:** ~6GB VRAM for full model, 4GB minimum with reduced layers

## Troubleshooting

### Server Won't Start
```bash
# Check logs
make llamacpp-logs

# Verify model file exists
ls -la ai_stack/llamacpp/models/

# Test with minimal configuration
docker run --rm -v $(pwd)/ai_stack/llamacpp/models:/models \
  llamacpp /llama.cpp/llama-server \
  --model /models/DeepSeek-R1-0528-Qwen3-8B-Q4_K_XL.gguf \
  --host 0.0.0.0 --port 8080 --ctx-size 2048
```

### GPU Issues
```bash
# Check GPU availability
nvidia-smi

# Verify CUDA installation
nvcc --version

# Test GPU container
docker run --rm --gpus all nvidia/cuda:12.1-base-ubuntu22.04 nvidia-smi
```

### Performance Issues
```bash
# Monitor resource usage
docker stats llama-cpp-server

# Check server metrics
curl http://localhost:8080/metrics

# Reduce context size for better performance
# Edit docker-compose.yml: --ctx-size 8192
```

### API Errors
```bash
# Test basic connectivity
curl -f http://localhost:8080/health

# Check server response
curl -v http://localhost:8080/completion \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "max_tokens": 5}'
```

## File Locations

- **Models:** `./ai_stack/llamacpp/models/`
- **Dockerfile:** `./ai_stack/llamacpp/Dockerfile`
- **Compose:** `./ai_stack/llamacpp/docker-compose.yml`
- **Scripts:** `./scripts/pull-deepseek-llamacpp.sh`, `./scripts/llamacpp-gpu.sh`

## Integration

### With Frontend Applications
```javascript
// Example frontend integration
const response = await fetch('http://localhost:8080/completion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: userInput,
    max_tokens: 200,
    temperature: 0.7,
    stream: false
  })
});

const result = await response.json();
console.log(result.content);
```

### With Python
```python
import requests

def query_llama(prompt, max_tokens=200):
    response = requests.post('http://localhost:8080/completion', 
        json={
            'prompt': prompt,
            'max_tokens': max_tokens,
            'temperature': 0.7,
            'stream': False
        })
    return response.json()['content']

# Usage
result = query_llama("Explain neural networks")
print(result)
```

## Monitoring

### Server Health
- Health endpoint: `http://localhost:8080/health`
- Metrics endpoint: `http://localhost:8080/metrics`
- Logs: `make llamacpp-logs`

### Performance Metrics
- Request latency and throughput
- Token generation speed
- Memory and GPU utilization
- Queue depth and processing time
