#!/usr/bin/env bash

set -e
set -x

# Script to generate FastAPI client from Ollama OpenAPI specification
# This generates a TypeScript client for the Ollama API endpoints

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Generating Ollama FastAPI Client${NC}"

# Check if openapi-ts is available
if ! command -v openapi-ts &> /dev/null; then
    echo -e "${YELLOW}⚠️  openapi-ts not found globally, using npx...${NC}"
    OPENAPI_CMD="npx @hey-api/openapi-ts"
else
    OPENAPI_CMD="openapi-ts"
fi

# Set paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OLLAMA_OPENAPI_PATH="$PROJECT_ROOT/ai_stack/ollama/openapi.json"
OUTPUT_DIR="$PROJECT_ROOT/frontend/src/ollama-client"

# Verify the OpenAPI file exists
if [ ! -f "$OLLAMA_OPENAPI_PATH" ]; then
    echo -e "${RED}❌ Error: OpenAPI file not found at $OLLAMA_OPENAPI_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}📋 Using OpenAPI spec: $OLLAMA_OPENAPI_PATH${NC}"
echo -e "${GREEN}📁 Output directory: $OUTPUT_DIR${NC}"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate the client
echo -e "${GREEN}⚙️  Generating TypeScript client...${NC}"

cd "$PROJECT_ROOT/frontend"

# Generate client using openapi-ts
$OPENAPI_CMD \
    --input "$OLLAMA_OPENAPI_PATH" \
    --output "$OUTPUT_DIR" \
    --client "axios" \
    --useOptions

# Format the generated code
if command -v biome &> /dev/null; then
    echo -e "${GREEN}🎨 Formatting generated code...${NC}"
    npx biome format --write "$OUTPUT_DIR"
else
    echo -e "${YELLOW}⚠️  Biome not available, skipping formatting${NC}"
fi

echo -e "${GREEN}✅ Ollama FastAPI client generated successfully!${NC}"
echo -e "${GREEN}📍 Client available at: $OUTPUT_DIR${NC}"
echo ""
echo -e "${YELLOW}💡 Usage example:${NC}"
echo -e "${YELLOW}import { DefaultApi } from './ollama-client';${NC}"
echo -e "${YELLOW}const api = new DefaultApi();${NC}"
echo -e "${YELLOW}const models = await api.listLocalModelsV1ModelsGet();${NC}"
