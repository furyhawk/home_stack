# Model Setup Scripts

This directory contains scripts to download and set up AI models for the Ollama service.

## Available Scripts

### 1. `pull-deepseek-model.sh`
Main script that downloads the DeepSeek-R1-0528-Qwen3-8B model in GGUF format from Hugging Face and loads it into Ollama.

**Features:**
- Downloads the Q4_K_XL quantized version (optimal balance of quality and size)
- Creates a proper Modelfile with appropriate templates and parameters
- Loads the model into Ollama with the name `deepseek-r1-qwen3-8b`
- Includes verification and testing steps

**Requirements:**
- `huggingface-hub` Python package (will be installed automatically if missing)
- Ollama container running
- Internet connection

**Usage:**
```bash
# Using Makefile (recommended)
make setup-ollama          # Start Ollama and pull model automatically
make pull-deepseek-model   # Pull model only (requires Ollama to be running)

# Or run directly
./scripts/pull-deepseek-model.sh
```

### 2. `pull-model-simple.sh`
Alternative script that attempts to pull models using `ollama pull` command.

**Usage:**
```bash
./scripts/pull-model-simple.sh
```

## Makefile Targets

The main Makefile includes these Ollama-related targets:

- `make ollama-up` - Start only the Ollama container
- `make ollama-down` - Stop only the Ollama container  
- `make ollama-logs` - View Ollama container logs
- `make pull-deepseek-model` - Download and load DeepSeek model
- `make setup-ollama` - Complete setup (start Ollama + pull model)

## Model Information

**DeepSeek-R1-0528-Qwen3-8B-GGUF**
- **Source:** [unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF](https://huggingface.co/unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF)
- **Quantization:** Q4_K_XL (4-bit quantization, extra large)
- **Size:** ~5.5GB
- **Context Length:** 32,768 tokens
- **Use Case:** General conversation, reasoning, coding assistance

## Quick Start

1. **Start the entire stack:**
   ```bash
   make up
   ```

2. **Or start just Ollama and set up the model:**
   ```bash
   make setup-ollama
   ```

3. **Use the model:**
   ```bash
   # Via Docker
   docker exec ollama-server ollama run deepseek-r1-qwen3-8b "Hello, how are you?"
   
   # Via API
   curl http://localhost:11434/api/generate -d '{
     "model": "deepseek-r1-qwen3-8b",
     "prompt": "Hello, how are you?",
     "stream": false
   }'
   ```

## Troubleshooting

1. **Script fails with "Ollama not running":**
   - Make sure Ollama container is started: `make ollama-up`
   - Wait a few seconds for the service to be ready

2. **Download fails:**
   - Check internet connection
   - Verify Hugging Face Hub access
   - Try installing huggingface-hub manually: `pip install huggingface-hub`

3. **Model loading fails:**
   - Check if the GGUF file was downloaded completely
   - Verify the Modelfile syntax
   - Check Ollama container logs: `make ollama-logs`

4. **Out of disk space:**
   - The model file is ~5.5GB, ensure sufficient free space
   - Consider using a smaller quantization (modify the script)

## Customization

You can modify the scripts to download different models or quantizations:

1. **Change model variant:** Edit `MODEL_FILE` in `pull-deepseek-model.sh`
2. **Adjust parameters:** Modify the Modelfile template in the script
3. **Use different model:** Change `MODEL_REPO` to any GGUF model on Hugging Face

## File Locations

- **Models:** `./ai_stack/ollama/models/`
- **Modelfiles:** `./ai_stack/ollama/models/Modelfile.*`
- **Ollama data:** Docker volume `ollama_data`
