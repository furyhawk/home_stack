# Makefile for managing Podman Compose

# Variables
COMPOSE_FILE=docker-compose.yml
PROJECT_NAME=home
DB_VOLUME=home_app-db-data
BACKUP_DIR=./backups

# Targets
.PHONY: up down restart logs build

up:
	podman compose up -d

down:
	podman compose down
	@echo "Containers stopped. Use 'make up' to start them again."

build:
	podman-compose build --build-arg network=host
	@echo "Containers built. Use 'make up' to start them."

restart: down build up

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
	podman compose up -d
	@echo "Backup and restore completed."
	@echo "Please check the logs for any errors."
	@echo "Use 'make logs' to view the logs."

logs:
	podman compose logs
	@echo "Logs for all containers:"

clean:
	podman compose down
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
	@echo "  make up         Start the containers in detached mode"
	@echo "  make down       Stop the containers"
	@echo "  make logs       View the logs of the containers"
	@echo "  make build      Build the containers"
	@echo "  make restart    Restart the containers"
	@echo "  make backup     Create a backup of the database volume"
	@echo "  make restore    Restore the database volume from a backup"
	@echo "  make clean      Remove all containers and volumes"
	@echo "  make prune      Remove all stopped containers and unused volumes"
	@echo "  make help       View this help message"
	@echo ""
