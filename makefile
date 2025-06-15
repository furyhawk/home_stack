# Makefile for managing Podman Compose

# Variables
COMPOSE_FILE=docker-compose.yml
PROJECT_NAME=home
DB_VOLUME=home_app-db-data
BACKUP_DIR=./backups
ENV_FILE=.env

# Load environment variables from .env
include $(ENV_FILE)
export

# Targets
.PHONY: up down restart logs build reset network pull-deepseek-model ollama-up ollama-down ollama-logs llamacpp-up llamacpp-down llamacpp-logs llamacpp-build llamacpp-build-host pull-deepseek-llamacpp llamacpp-gpu ai-launcher

network:
	@podman network exists traefik-public || podman network create traefik-public
	@echo "Traefik network ready."

up: network
	podman compose --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml up -d

down:
	podman compose --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml down
	@echo "Containers stopped. Use 'make up' to start them again."

build:
	DOCKER_BUILDKIT=0 podman compose --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml build --no-cache
	@echo "Containers built. Use 'make up' to start them."

restart: down build up

reset:
	podman compose --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml down -v
	podman system prune -f
	podman volume prune -f
	podman network prune -f
	podman pod prune -f
	@echo "Environment completely reset. Use 'make build' then 'make up' to recreate."

backup:
	@mkdir -p $(BACKUP_DIR)
	$(eval TIMESTAMP := $(shell date +%Y%m%d_%H%M%S))
	podman volume export $(DB_VOLUME) --output $(BACKUP_DIR)/$(DB_VOLUME)_$(TIMESTAMP).tar
	@echo "Backup created: $(BACKUP_DIR)/$(DB_VOLUME)_$(TIMESTAMP).tar"

restore:
	$(eval LATEST_BACKUP := $(shell ls -t $(BACKUP_DIR)/$(DB_VOLUME)_*.tar 2>/dev/null | head -n1))
	@if [ -z "$(LATEST_BACKUP)" ]; then \
		echo "No backup files found in $(BACKUP_DIR)"; \
		exit 1; \
	fi
	@echo "Restoring from latest backup: $(LATEST_BACKUP)"
	podman volume rm $(DB_VOLUME) || true
	podman volume create --name $(DB_VOLUME)
	podman volume import $(DB_VOLUME) --input $(LATEST_BACKUP)
	podman compose --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml up -d
	@echo "Backup and restore completed."
	@echo "Please check the logs for any errors."
	@echo "Use 'make logs' to view the logs."

logs:
	podman compose --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml logs
	@echo "Logs for all containers:"

clean:
	podman compose --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml down
	podman volume rm $(DB_VOLUME)
	@echo "Cleaned up all containers and volumes."

prune:
	podman volume prune
	podman container prune
	podman network prune
	podman image prune
	@echo "Pruned all stopped containers and unused volumes."

help:
	@echo "Makefile for managing Podman Compose"
	@echo ""
	@echo "Usage:"
	@echo "  make network              Create the traefik-public network if it doesn't exist"
	@echo "  make up                   Start the containers in detached mode"
	@echo "  make down                 Stop the containers"
	@echo "  make logs                 View the logs of the containers"
	@echo "  make build                Build the containers"
	@echo "  make restart              Restart the containers"
	@echo "  make reset                Completely reset Podman (containers, volumes, networks)"
	@echo "  make backup               Create a backup of the database volume"
	@echo "  make restore              Restore the database volume from a backup"
	@echo "  make clean                Remove all containers and volumes"
	@echo "  make prune                Remove all stopped containers and unused volumes"
	@echo "  make info                 Display detailed information about Podman state"
	@echo "  make help                 View this help message"
	@echo "  make ai-launcher          Interactive AI backend launcher (recommended for new users)"
	@echo ""
	@echo "Ollama-specific targets:"
	@echo "  make ollama-up            Start only the Ollama container"
	@echo "  make ollama-down          Stop only the Ollama container"
	@echo "  make ollama-logs          View Ollama container logs"
	@echo "  make pull-deepseek-model  Download and load DeepSeek-R1 model into Ollama"
	@echo "  make setup-ollama         Start Ollama and automatically pull DeepSeek model"
	@echo ""
	@echo "LlamaCPP-specific targets:"
	@echo "  make llamacpp-build       Build LlamaCPP container with no cache (using slirp4netns)"
	@echo "  make llamacpp-build-host  Build LlamaCPP container with host networking (alternative)"
	@echo "  make llamacpp-up          Start only the LlamaCPP container"
	@echo "  make llamacpp-down        Stop only the LlamaCPP container"
	@echo "  make llamacpp-logs        View LlamaCPP container logs"
	@echo "  make pull-deepseek-llamacpp  Download DeepSeek-R1 model for LlamaCPP"
	@echo "  make setup-llamacpp       Start LlamaCPP and automatically pull DeepSeek model"
	@echo "  make llamacpp-gpu         Start GPU-accelerated LlamaCPP with DeepSeek model"
	@echo ""
	@echo "LlamaCPP-specific targets:"
	@echo "  make llamacpp-up          Start only the LlamaCPP container"
	@echo "  make llamacpp-down        Stop only the LlamaCPP container"
	@echo "  make llamacpp-logs        View LlamaCPP container logs"
	@echo "  make pull-deepseek-llamacpp  Download and load DeepSeek-R1 model into LlamaCPP"
	@echo "  make setup-llamacpp       Start LlamaCPP and automatically pull DeepSeek model"
	@echo ""

info:
	@echo "===== Podman System Info ====="
	podman info
	@echo "\n===== Podman Networks ====="
	podman network ls
	@echo "\n===== Podman Volumes ====="
	podman volume ls
	@echo "\n===== Podman Containers ====="
	podman ps -a
	@echo "\n===== Podman Images ====="
	podman images
	@echo "\n===== Podman Compose Config ====="
	podman compose --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml config

# Ollama-specific targets
ollama-up:
	cd ai_stack/ollama && podman compose up -d
	@echo "Ollama container started. Use 'make pull-deepseek-model' to download and load the DeepSeek model."

ollama-down:
	cd ai_stack/ollama && podman compose down
	@echo "Ollama container stopped."

ollama-logs:
	cd ai_stack/ollama && podman compose logs -f

pull-deepseek-model:
	@echo "Pulling DeepSeek-R1 model from Hugging Face..."
	./scripts/pull-deepseek-model.sh
	@echo "Model setup completed. You can now use the model with Ollama."

# Combined target to start Ollama and pull the model
setup-ollama: ollama-up
	@echo "Waiting for Ollama to be ready..."
	@sleep 10
	@$(MAKE) pull-deepseek-model

# LlamaCPP-specific targets
llamacpp-build:
	cd ai_stack/llamacpp && DOCKER_BUILDKIT=0 CONTAINERS_NETNS=slirp4netns podman compose build --no-cache
	@echo "LlamaCPP container built with no cache. Use 'make llamacpp-up' to start it."

llamacpp-build-host:
	cd ai_stack/llamacpp && DOCKER_BUILDKIT=0 podman build --network=host --no-cache -t localhost/llama-cpp-server:latest .
	@echo "LlamaCPP container built with host networking. Use 'make llamacpp-up' to start it."

llamacpp-up:
	cd ai_stack/llamacpp && podman compose up -d
	@echo "LlamaCPP container started. Use 'make pull-deepseek-llamacpp' to download the DeepSeek model."

llamacpp-down:
	cd ai_stack/llamacpp && podman compose down
	@echo "LlamaCPP container stopped."

llamacpp-logs:
	cd ai_stack/llamacpp && podman compose logs -f

pull-deepseek-llamacpp:
	@echo "Pulling DeepSeek-R1 model from Hugging Face for LlamaCPP..."
	./scripts/pull-deepseek-llamacpp.sh
	@echo "Model setup completed. You can now use the model with LlamaCPP."

# Combined target to start LlamaCPP and pull the model
setup-llamacpp: llamacpp-up
	@echo "Waiting for LlamaCPP to be ready..."
	@sleep 15
	@$(MAKE) pull-deepseek-llamacpp

# GPU-accelerated LlamaCPP
llamacpp-gpu:
	@echo "Starting GPU-accelerated LlamaCPP with DeepSeek model..."
	./scripts/llamacpp-gpu.sh

# Interactive AI backend launcher
ai-launcher:
	@./scripts/ai-launcher.sh
