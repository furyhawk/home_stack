# Ollama Docker Setup

This directory contains the Docker configuration for running [Ollama](https://ollama.com/), a lightweight and extensible framework for running large language models locally.

## Overview

Ollama allows you to run large language models like Llama 2, Code Llama, and other models locally with a simple API interface. This Docker setup provides an easy way to deploy and manage Ollama in a containerized environment.

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 8GB of RAM (16GB+ recommended for larger models)
- Optional: NVIDIA GPU with Docker GPU support for better performance

### Running Ollama

1. **Start the service:**
   ```bash
   docker-compose up -d
   ```

2. **Check if the service is running:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f ollama
   ```

## Using Ollama

### Pulling Models

Once Ollama is running, you can pull models using the following commands:

```bash
# Pull Llama 2 (7B parameters)
docker exec ollama-server ollama pull llama2

# Pull Code Llama for code generation
docker exec ollama-server ollama pull codellama

# Pull Mistral 7B
docker exec ollama-server ollama pull mistral

# Pull other available models
docker exec ollama-server ollama pull llama2:13b
docker exec ollama-server ollama pull llama2:70b
```

### List Available Models

```bash
docker exec ollama-server ollama list
```

### Running Models

```bash
# Run interactive chat with a model
docker exec -it ollama-server ollama run llama2

# Run with specific prompt
docker exec ollama-server ollama run llama2 "Explain quantum computing"
```

### API Usage

Ollama provides a REST API accessible at `http://localhost:11434`. Here are some examples:

#### Generate Text

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Why is the sky blue?",
  "stream": false
}'
```

#### Chat API

```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama2",
  "messages": [
    {
      "role": "user",
      "content": "Why is the sky blue?"
    }
  ],
  "stream": false
}'
```

#### List Models via API

```bash
curl http://localhost:11434/api/tags
```

## Configuration

### Environment Variables

- `OLLAMA_HOST`: Host binding (default: `0.0.0.0`)
- `OLLAMA_PORT`: Port number (default: `11434`)

### Volumes

- `./models:/models`: Local directory for storing model files
- `ollama_data:/usr/share/ollama/.ollama`: Persistent storage for Ollama data and models

### GPU Support

To enable GPU acceleration (NVIDIA only), uncomment the GPU configuration in `docker-compose.yml`:

```yaml
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: all
          capabilities: [gpu]
```

**Prerequisites for GPU support:**
- NVIDIA GPU with CUDA support
- NVIDIA Container Toolkit installed
- Docker configured for GPU access

## Model Management

### Popular Models

| Model | Size | Use Case | Pull Command |
|-------|------|----------|--------------|
| Llama 2 | 7B | General purpose | `ollama pull llama2` |
| Llama 2 | 13B | Better quality | `ollama pull llama2:13b` |
| Code Llama | 7B | Code generation | `ollama pull codellama` |
| Mistral | 7B | Fast inference | `ollama pull mistral` |
| Phi-2 | 2.7B | Lightweight | `ollama pull phi` |

### Custom Models

You can also create custom models using a Modelfile:

1. Create a `Modelfile`:
   ```
   FROM llama2
   PARAMETER temperature 0.8
   PARAMETER top_p 0.9
   ```

2. Create the model:
   ```bash
   docker exec ollama-server ollama create mymodel -f Modelfile
   ```

## Troubleshooting

### Common Issues

1. **Service won't start:**
   - Check Docker logs: `docker-compose logs ollama`
   - Ensure port 11434 is available
   - Verify sufficient system resources

2. **Models fail to download:**
   - Check internet connectivity
   - Ensure sufficient disk space
   - Try smaller models first

3. **Performance issues:**
   - Consider enabling GPU support
   - Increase Docker memory limits
   - Use smaller models for testing

### Health Checks

The container includes a health check that verifies the API is responding:

```bash
# Check container health
docker inspect ollama-server --format='{{.State.Health.Status}}'
```

### Resource Usage

Monitor resource usage:

```bash
# Container stats
docker stats ollama-server

# Disk usage
docker exec ollama-server du -sh /usr/share/ollama/.ollama
```

## Integration Examples

### Python Integration

```python
import requests
import json

def chat_with_ollama(message, model="llama2"):
    url = "http://localhost:11434/api/chat"
    data = {
        "model": model,
        "messages": [{"role": "user", "content": message}],
        "stream": False
    }
    
    response = requests.post(url, json=data)
    return response.json()["message"]["content"]

# Example usage
response = chat_with_ollama("Explain machine learning")
print(response)
```

### JavaScript Integration

```javascript
async function chatWithOllama(message, model = "llama2") {
    const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: message }],
            stream: false,
        }),
    });
    
    const data = await response.json();
    return data.message.content;
}

// Example usage
chatWithOllama("What is the capital of France?").then(console.log);
```

## Security Considerations

- Ollama runs as a non-root user inside the container
- API is bound to all interfaces (0.0.0.0) for container access
- Consider using a reverse proxy (nginx, traefik) for production deployments
- Implement authentication/authorization for production use

## Performance Optimization

### Memory Management

- Allocate sufficient RAM based on model size:
  - 7B models: 8GB+ RAM
  - 13B models: 16GB+ RAM
  - 70B models: 64GB+ RAM

### GPU Acceleration

- NVIDIA GPUs significantly improve inference speed
- Ensure GPU memory is sufficient for the model
- Use mixed precision for better GPU utilization

## Maintenance

### Updates

Update Ollama to the latest version:

```bash
# Rebuild with latest Ollama
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Cleanup

Remove unused models and data:

```bash
# Remove specific model
docker exec ollama-server ollama rm model_name

# Clean up unused Docker resources
docker system prune -f
```

## Links

- [Ollama Official Website](https://ollama.com/)
- [Ollama GitHub Repository](https://github.com/ollama/ollama)
- [Available Models](https://ollama.com/library)
- [API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)

## Support

For issues specific to this Docker setup, check the container logs and ensure all prerequisites are met. For Ollama-specific issues, refer to the official Ollama documentation and GitHub issues.
