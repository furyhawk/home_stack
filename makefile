# Makefile for managing Docker or Podman

# Variables
COMPOSE_FILE=docker-compose.yml
PROJECT_NAME=home
DB_VOLUME=home_app-db-data
BACKUP_DIR=./backups
ENV_FILE=.env
CONTAINER_ENGINE?=podman
BUILD_NETWORK?=host
IMAGE_TAG=$(if $(TAG),$(TAG),latest)
BACKEND_IMAGE?=$(DOCKER_IMAGE_BACKEND):$(IMAGE_TAG)
FRONTEND_IMAGE?=$(DOCKER_IMAGE_FRONTEND):$(IMAGE_TAG)
PLAYWRIGHT_IMAGE?=docker.io/furyhawk/home_stack_playwright:latest
FRONTEND_BUILD_VITE_API_URL?=https://service.furyhawk.lol
FRONTEND_BUILD_NODE_ENV?=development
PLAYWRIGHT_BUILD_VITE_API_URL?=https://service.furyhawk.lol
PLAYWRIGHT_BUILD_NODE_ENV?=production

ifeq ($(CONTAINER_ENGINE),docker)
COMPOSE_CMD=$(CONTAINER_ENGINE) compose
NETWORK_EXISTS_CMD=$(CONTAINER_ENGINE) network inspect traefik-public >/dev/null 2>&1
else ifeq ($(CONTAINER_ENGINE),podman)
COMPOSE_CMD=$(CONTAINER_ENGINE) compose
NETWORK_EXISTS_CMD=$(CONTAINER_ENGINE) network exists traefik-public >/dev/null 2>&1
else
$(error Unsupported CONTAINER_ENGINE '$(CONTAINER_ENGINE)'. Use 'podman' or 'docker')
endif

ifeq ($(OS),Windows_NT)
CREATE_LOCAL_DIRS_CMD=powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path 'backend/htmlcov','frontend/blob-report','frontend/test-results' | Out-Null"
else
CREATE_LOCAL_DIRS_CMD=mkdir -p backend/htmlcov frontend/blob-report frontend/test-results
endif

# Load environment variables from .env
include $(ENV_FILE)
export

# Targets
.PHONY: up up-e2e down restart logs build reset network deploy-local deploy-production clean prune backup restore help info ollama-build ollama-build-host ollama-up ollama-down ollama-logs pull-deepseek-model setup-ollama llamacpp-build llamacpp-build-host llamacpp-up llamacpp-down llamacpp-logs pull-deepseek-llamacpp setup-llamacpp llamacpp-gpu ai-launcher

ensure-local-dirs:
	@$(CREATE_LOCAL_DIRS_CMD)
	@echo "Local bind-mount directories are ready."

network:
	@$(NETWORK_EXISTS_CMD) || $(CONTAINER_ENGINE) network create traefik-public
	@echo "Traefik network ready."

up: network ensure-local-dirs
	$(COMPOSE_CMD) --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml up -d

up-e2e: network ensure-local-dirs
	$(COMPOSE_CMD) --profile e2e --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml up -d

down:
	$(COMPOSE_CMD) --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml down --remove-orphans
	@echo "Containers stopped. Use 'make up' to start them again."

build:
	$(CONTAINER_ENGINE) build --network $(BUILD_NETWORK) --no-cache -t $(BACKEND_IMAGE) -f backend/Dockerfile backend
	$(CONTAINER_ENGINE) build --network $(BUILD_NETWORK) --no-cache -t $(FRONTEND_IMAGE) --build-arg VITE_API_URL=$(FRONTEND_BUILD_VITE_API_URL) --build-arg NODE_ENV=$(FRONTEND_BUILD_NODE_ENV) -f frontend/Dockerfile frontend
	$(CONTAINER_ENGINE) build --network $(BUILD_NETWORK) --no-cache -t $(PLAYWRIGHT_IMAGE) --build-arg VITE_API_URL=$(PLAYWRIGHT_BUILD_VITE_API_URL) --build-arg NODE_ENV=$(PLAYWRIGHT_BUILD_NODE_ENV) -f frontend/Dockerfile.playwright frontend
	@echo "Containers built. Use 'make up' to start them."

restart: down build up

reset:
	$(COMPOSE_CMD) --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml down --remove-orphans -v
	$(CONTAINER_ENGINE) system prune -f
	$(CONTAINER_ENGINE) volume prune -f
	$(CONTAINER_ENGINE) network prune -f
	@if [ "$(CONTAINER_ENGINE)" = "podman" ]; then $(CONTAINER_ENGINE) pod prune -f; fi
	@echo "Environment completely reset. Use 'make build' then 'make up' to recreate."

deploy-local: network ensure-local-dirs build
	$(COMPOSE_CMD) --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml down --remove-orphans
	$(COMPOSE_CMD) --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml up -d
	@echo "Local deployment completed using docker-compose.yml + docker-compose.override.yml"

deploy-production: network
	$(COMPOSE_CMD) --env-file $(ENV_FILE) -f docker-compose.yml up -d --build
	@echo "Production deployment completed using docker-compose.yml"

backup:
	@mkdir -p $(BACKUP_DIR)
	$(eval TIMESTAMP := $(shell date +%Y%m%d_%H%M%S))
	$(CONTAINER_ENGINE) run --rm -v $(DB_VOLUME):/volume -v $(abspath $(BACKUP_DIR)):/backup alpine:3.22 tar -C /volume -cf /backup/$(DB_VOLUME)_$(TIMESTAMP).tar .
	@echo "Backup created: $(BACKUP_DIR)/$(DB_VOLUME)_$(TIMESTAMP).tar"

restore:
	$(eval LATEST_BACKUP := $(shell ls -t $(BACKUP_DIR)/$(DB_VOLUME)_*.tar 2>/dev/null | head -n1))
	@if [ -z "$(LATEST_BACKUP)" ]; then \
		echo "No backup files found in $(BACKUP_DIR)"; \
		exit 1; \
	fi
	@echo "Restoring from latest backup: $(LATEST_BACKUP)"
	$(CONTAINER_ENGINE) volume rm $(DB_VOLUME) || true
	$(CONTAINER_ENGINE) volume create $(DB_VOLUME)
	$(CONTAINER_ENGINE) run --rm -v $(DB_VOLUME):/volume -v $(abspath $(BACKUP_DIR)):/backup alpine:3.22 sh -c "tar -C /volume -xf /backup/$(notdir $(LATEST_BACKUP))"
	@$(CREATE_LOCAL_DIRS_CMD)
	$(COMPOSE_CMD) --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml down --remove-orphans
	$(COMPOSE_CMD) --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml up -d
	@echo "Backup and restore completed."
	@echo "Please check the logs for any errors."
	@echo "Use 'make logs' to view the logs."

logs:
	$(COMPOSE_CMD) --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml logs
	@echo "Logs for all containers:"

clean:
	$(COMPOSE_CMD) --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml down
	$(CONTAINER_ENGINE) volume rm $(DB_VOLUME)
	@echo "Cleaned up all containers and volumes."

prune:
	$(CONTAINER_ENGINE) volume prune
	$(CONTAINER_ENGINE) container prune
	$(CONTAINER_ENGINE) network prune
	$(CONTAINER_ENGINE) image prune
	@echo "Pruned all stopped containers and unused volumes."

help:
	@echo "Makefile for managing Docker or Podman"
	@echo ""
	@echo "Usage:"
	@echo "  make <target> [CONTAINER_ENGINE=podman|docker]"
	@echo "  make network              Create the traefik-public network if it doesn't exist"
	@echo "  make up                   Start the containers in detached mode"
	@echo "  make up-e2e               Start containers including the Playwright test service"
	@echo "  make down                 Stop the containers"
	@echo "  make logs                 View the logs of the containers"
	@echo "  make build                Build backend, frontend, and Playwright images with the selected engine"
	@echo "  make restart              Restart the containers"
	@echo "  make reset                Completely reset the selected engine state"
	@echo "  make deploy-local         Deploy locally with development overrides"
	@echo "  make deploy-production    Deploy with production compose file only"
	@echo "  make backup               Create a backup of the database volume"
	@echo "  make restore              Restore the database volume from a backup"
	@echo "  make clean                Remove all containers and volumes"
	@echo "  make prune                Remove all stopped containers and unused volumes"
	@echo "  make info                 Display detailed information about the selected engine state"
	@echo "  make help                 View this help message"
	@echo "  make ai-launcher          Interactive AI backend launcher (recommended for new users)"
	@echo ""
	@echo "Defaults to Podman. Set CONTAINER_ENGINE=docker to use Docker instead."
	@echo ""
	@echo "Ollama-specific targets:"
	@echo "  make ollama-build         Build Ollama container with no cache (using host networking)"
	@echo "  make ollama-build-host    Build Ollama container with host networking (alternative)"
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

info:
	@echo "===== $(CONTAINER_ENGINE) System Info ====="
	$(CONTAINER_ENGINE) info
	@echo "\n===== $(CONTAINER_ENGINE) Networks ====="
	$(CONTAINER_ENGINE) network ls
	@echo "\n===== $(CONTAINER_ENGINE) Volumes ====="
	$(CONTAINER_ENGINE) volume ls
	@echo "\n===== $(CONTAINER_ENGINE) Containers ====="
	$(CONTAINER_ENGINE) ps -a
	@echo "\n===== $(CONTAINER_ENGINE) Images ====="
	$(CONTAINER_ENGINE) images
	@echo "\n===== Compose Config ====="
	$(COMPOSE_CMD) --env-file $(ENV_FILE) -f docker-compose.yml -f docker-compose.override.yml config

# Ollama-specific targets
ollama-build:
	cd ai_stack/ollama && DOCKER_BUILDKIT=0 $(COMPOSE_CMD) build --no-cache
	@echo "Ollama container built with no cache. Use 'make ollama-up' to start it."

ollama-build-host:
	cd ai_stack/ollama && DOCKER_BUILDKIT=0 $(CONTAINER_ENGINE) build --network=host --no-cache -t localhost/ollama-server:latest .
	@echo "Ollama container built with host networking. Use 'make ollama-up' to start it."

ollama-up:
	cd ai_stack/ollama && $(COMPOSE_CMD) up -d
	@echo "Ollama container started. Use 'make pull-deepseek-model' to download and load the DeepSeek model."

ollama-down:
	cd ai_stack/ollama && $(COMPOSE_CMD) down
	@echo "Ollama container stopped."

ollama-logs:
	cd ai_stack/ollama && $(COMPOSE_CMD) logs -f

pull-deepseek-model:
	@echo "Pulling DeepSeek-R1 model from Hugging Face..."
	./scripts/pull-deepseek-model.sh
	@echo "Model setup completed. You can now use the model with Ollama."

setup-ollama: ollama-up
	@echo "Waiting for Ollama to be ready..."
	@sleep 10
	@$(MAKE) pull-deepseek-model

# LlamaCPP-specific targets
llamacpp-build:
	cd ai_stack/llamacpp && DOCKER_BUILDKIT=0 CONTAINERS_NETNS=slirp4netns $(COMPOSE_CMD) build --no-cache
	@echo "LlamaCPP container built with no cache. Use 'make llamacpp-up' to start it."

llamacpp-build-host:
	cd ai_stack/llamacpp && DOCKER_BUILDKIT=0 $(CONTAINER_ENGINE) build --network=host --no-cache -t localhost/llama-cpp-server:latest .
	@echo "LlamaCPP container built with host networking. Use 'make llamacpp-up' to start it."

llamacpp-up:
	cd ai_stack/llamacpp && $(COMPOSE_CMD) up -d
	@echo "LlamaCPP container started. Use 'make pull-deepseek-llamacpp' to download the DeepSeek model."

llamacpp-down:
	cd ai_stack/llamacpp && $(COMPOSE_CMD) down
	@echo "LlamaCPP container stopped."

llamacpp-logs:
	cd ai_stack/llamacpp && $(COMPOSE_CMD) logs -f

pull-deepseek-llamacpp:
	@echo "Pulling DeepSeek-R1 model from Hugging Face for LlamaCPP..."
	./scripts/pull-deepseek-llamacpp.sh
	@echo "Model setup completed. You can now use the model with LlamaCPP."

setup-llamacpp: llamacpp-up
	@echo "Waiting for LlamaCPP to be ready..."
	@sleep 15
	@$(MAKE) pull-deepseek-llamacpp

llamacpp-gpu:
	@echo "Starting GPU-accelerated LlamaCPP with DeepSeek model..."
	./scripts/llamacpp-gpu.sh

ai-launcher:
	@./scripts/ai-launcher.sh