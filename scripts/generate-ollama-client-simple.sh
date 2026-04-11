#!/usr/bin/env bash

# Simple script to generate TypeScript client using the project's existing tools
# This uses @hey-api/openapi-ts which is already configured in the project

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OLLAMA_OPENAPI_PATH="$PROJECT_ROOT/ai_stack/ollama/openapi.json"
OUTPUT_DIR="$PROJECT_ROOT/frontend/src/ollama-client"

echo -e "${GREEN}🚀 Generating Ollama TypeScript Client${NC}"

# Verify the OpenAPI file exists
if [ ! -f "$OLLAMA_OPENAPI_PATH" ]; then
    echo -e "${RED}❌ Error: OpenAPI file not found at $OLLAMA_OPENAPI_PATH${NC}"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Change to frontend directory
cd "$PROJECT_ROOT/frontend"

echo -e "${GREEN}📋 Using OpenAPI spec: $OLLAMA_OPENAPI_PATH${NC}"
echo -e "${GREEN}📁 Output directory: $OUTPUT_DIR${NC}"

# Generate client using the project's existing openapi-ts setup
echo -e "${GREEN}⚙️  Generating TypeScript client...${NC}"

npx @hey-api/openapi-ts \
    --input "$OLLAMA_OPENAPI_PATH" \
    --output "$OUTPUT_DIR" \
    --client "legacy/axios"

# Format the generated code with biome
if [ -f "biome.json" ]; then
    echo -e "${GREEN}🎨 Formatting generated code...${NC}"
    npx biome format --write "$OUTPUT_DIR"
fi

# Create a simple usage example
EXAMPLE_FILE="$OUTPUT_DIR/example.ts"
cat > "$EXAMPLE_FILE" << 'EOF'
/**
 * Example usage of the generated Ollama FastAPI client
 */
import { client, OllamaService } from './index';

// Configure the base URL for your Ollama API
client.setConfig({
  baseUrl: 'http://localhost:11434', // Default Ollama port
});

// Example: List available models
async function listModels() {
  try {
    const response = await OllamaService.listLocalModelsV1ModelsGet();
    console.log('Available models:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

// Example: Get a specific model
async function getModel(modelId: string) {
  try {
    const response = await OllamaService.getLocalModelV1ModelsModelIdGet({
      path: { model_id: modelId }
    });
    console.log('Model details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting model:', error);
  }
}

// Example: Chat completion
async function chatCompletion() {
  try {
    const response = await OllamaService.handleCompletionsV1ChatCompletionsPost({
      body: {
        model: 'llama2', // Replace with your model
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?'
          }
        ]
      }
    });
    console.log('Chat response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in chat completion:', error);
  }
}

// Example: Transcribe audio
async function transcribeAudio(audioFile: File) {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    
    const response = await OllamaService.transcribeFileV1AudioTranscriptionsPost({
      body: formData
    });
    console.log('Transcription:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error transcribing audio:', error);
  }
}

// Export the functions for use in your application
export {
  listModels,
  getModel,
  chatCompletion,
  transcribeAudio
};
EOF

echo -e "${GREEN}✅ Ollama TypeScript client generated successfully!${NC}"
echo -e "${GREEN}📍 Client available at: $OUTPUT_DIR${NC}"
echo -e "${GREEN}📝 Usage example: $EXAMPLE_FILE${NC}"
echo ""
echo -e "${YELLOW}💡 Quick start:${NC}"
echo -e "${YELLOW}import { listModels, chatCompletion } from './ollama-client/example';${NC}"
echo -e "${YELLOW}const models = await listModels();${NC}"
echo -e "${YELLOW}const response = await chatCompletion();${NC}"
