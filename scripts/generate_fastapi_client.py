#!/usr/bin/env python3
"""
Script to generate FastAPI clients from OpenAPI specifications.
Supports multiple output formats including Python, TypeScript, and more.
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional


class ClientGenerator:
    """Generator for FastAPI clients from OpenAPI specifications."""
    
    SUPPORTED_GENERATORS = {
        'python': 'python',
        'typescript': 'typescript-axios',
        'typescript-fetch': 'typescript-fetch',
        'javascript': 'javascript',
        'java': 'java',
        'go': 'go',
        'rust': 'rust',
        'php': 'php',
        'csharp': 'csharp'
    }
    
    def __init__(self, openapi_path: str, output_dir: str, generator: str = 'python'):
        self.openapi_path = Path(openapi_path)
        self.output_dir = Path(output_dir)
        self.generator = generator
        
        if not self.openapi_path.exists():
            raise FileNotFoundError(f"OpenAPI file not found: {openapi_path}")
            
        if generator not in self.SUPPORTED_GENERATORS:
            raise ValueError(f"Unsupported generator: {generator}. "
                           f"Supported: {list(self.SUPPORTED_GENERATORS.keys())}")
    
    def _check_dependencies(self) -> bool:
        """Check if required dependencies are available."""
        try:
            result = subprocess.run(['openapi-generator-cli', 'version'], 
                                  capture_output=True, text=True)
            return result.returncode == 0
        except FileNotFoundError:
            return False
    
    def _install_openapi_generator(self) -> bool:
        """Install OpenAPI Generator CLI via npm."""
        try:
            print("📦 Installing OpenAPI Generator CLI...")
            subprocess.run(['npm', 'install', '-g', '@openapitools/openapi-generator-cli'], 
                         check=True)
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install OpenAPI Generator CLI")
            return False
    
    def _validate_openapi_spec(self) -> Dict:
        """Validate and load the OpenAPI specification."""
        try:
            with open(self.openapi_path, 'r') as f:
                spec = json.load(f)
            
            # Basic validation
            if 'openapi' not in spec and 'swagger' not in spec:
                raise ValueError("Invalid OpenAPI specification")
                
            return spec
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in OpenAPI file: {e}")
    
    def generate_client(self, package_name: Optional[str] = None) -> bool:
        """Generate the client code."""
        print(f"🚀 Generating {self.generator} client from {self.openapi_path}")
        
        # Validate OpenAPI spec
        spec = self._validate_openapi_spec()
        print(f"✅ Valid OpenAPI {spec.get('openapi', spec.get('swagger', 'unknown'))} specification")
        
        # Check dependencies
        if not self._check_dependencies():
            print("⚠️  OpenAPI Generator CLI not found, attempting to install...")
            if not self._install_openapi_generator():
                print("❌ Failed to install OpenAPI Generator CLI")
                print("💡 Please install manually: npm install -g @openapitools/openapi-generator-cli")
                return False
        
        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Prepare generator command
        generator_name = self.SUPPORTED_GENERATORS[self.generator]
        cmd = [
            'openapi-generator-cli', 'generate',
            '-i', str(self.openapi_path),
            '-g', generator_name,
            '-o', str(self.output_dir),
        ]
        
        # Add additional options based on generator type
        if self.generator == 'python':
            cmd.extend([
                '--additional-properties',
                f'packageName={package_name or "ollama_client"}',
                '--additional-properties',
                'projectName=ollama-fastapi-client',
                '--additional-properties',
                'packageVersion=1.0.0'
            ])
        elif self.generator in ['typescript', 'typescript-fetch']:
            cmd.extend([
                '--additional-properties',
                'npmName=ollama-fastapi-client',
                '--additional-properties',
                'npmVersion=1.0.0'
            ])
        
        try:
            print(f"🔧 Running: {' '.join(cmd)}")
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            print("✅ Client generated successfully!")
            
            # Post-processing based on generator type
            self._post_process()
            
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Error generating client: {e}")
            if e.stdout:
                print(f"stdout: {e.stdout}")
            if e.stderr:
                print(f"stderr: {e.stderr}")
            return False
    
    def _post_process(self):
        """Post-process the generated client."""
        if self.generator == 'python':
            self._post_process_python()
        elif self.generator in ['typescript', 'typescript-fetch']:
            self._post_process_typescript()
    
    def _post_process_python(self):
        """Post-process Python client."""
        # Create a simple usage example
        example_file = self.output_dir / 'example_usage.py'
        example_content = '''#!/usr/bin/env python3
"""
Example usage of the generated Ollama FastAPI client.
"""

from ollama_client import ApiClient, Configuration
from ollama_client.api.default_api import DefaultApi

# Configure the client
configuration = Configuration(
    host="http://localhost:8000"  # Adjust to your Ollama API endpoint
)

# Create API client
with ApiClient(configuration) as api_client:
    api = DefaultApi(api_client)
    
    try:
        # List available models
        models = api.list_local_models_v1_models_get()
        print("Available models:")
        for model in models.data:
            print(f"  - {model.id}")
            
    except Exception as e:
        print(f"Error: {e}")
'''
        with open(example_file, 'w') as f:
            f.write(example_content)
        print(f"📝 Created usage example: {example_file}")
    
    def _post_process_typescript(self):
        """Post-process TypeScript client."""
        # Create a simple usage example
        example_file = self.output_dir / 'example-usage.ts'
        example_content = '''/**
 * Example usage of the generated Ollama FastAPI client.
 */

import { Configuration, DefaultApi } from './';

// Configure the client
const configuration = new Configuration({
    basePath: 'http://localhost:8000', // Adjust to your Ollama API endpoint
});

// Create API client
const api = new DefaultApi(configuration);

async function listModels() {
    try {
        const response = await api.listLocalModelsV1ModelsGet();
        console.log('Available models:');
        response.data.data.forEach(model => {
            console.log(`  - ${model.id}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the example
listModels();
'''
        with open(example_file, 'w') as f:
            f.write(example_content)
        print(f"📝 Created usage example: {example_file}")


def main():
    parser = argparse.ArgumentParser(description='Generate FastAPI clients from OpenAPI specifications')
    parser.add_argument('openapi_path', help='Path to the OpenAPI JSON/YAML file')
    parser.add_argument('-o', '--output', required=True, help='Output directory for generated client')
    parser.add_argument('-g', '--generator', 
                       choices=list(ClientGenerator.SUPPORTED_GENERATORS.keys()),
                       default='python',
                       help='Client generator type (default: python)')
    parser.add_argument('-p', '--package-name', help='Package name for generated client')
    parser.add_argument('--list-generators', action='store_true', 
                       help='List all supported generators')
    
    args = parser.parse_args()
    
    if args.list_generators:
        print("Supported generators:")
        for name, generator in ClientGenerator.SUPPORTED_GENERATORS.items():
            print(f"  {name:20} -> {generator}")
        return
    
    try:
        generator = ClientGenerator(args.openapi_path, args.output, args.generator)
        success = generator.generate_client(args.package_name)
        
        if success:
            print(f"\n🎉 Client generated successfully!")
            print(f"📁 Output directory: {args.output}")
            print(f"🔧 Generator used: {args.generator}")
        else:
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
