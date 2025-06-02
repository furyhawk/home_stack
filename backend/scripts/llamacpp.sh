#!/bin/bash

# Start Llama.cpp service using Podman with GPU support
podman run -d --name llamacpp-server -p 8000:8000 --gpus all -v $HOME/models:/models localhost/local/llama.cpp:full-cuda -s -m /models/DeepSeek-R1-0528-Qwen3-8B-UD-Q4_K_XL.gguf --port 8000 --host 0.0.0.0 -n 512 --n-gpu-layers 1