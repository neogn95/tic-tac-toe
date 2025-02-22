#!/bin/bash

# Script to start Nakama using docker-compose
# Usage: ./start-nakama.sh

# Variables
COMPOSE_TEMPLATE="docker-compose-cloud.yml.template"
COMPOSE_FILE="docker-compose-cloud.yml"

# Logging function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
  log "Error: docker-compose is not installed. Installing ..."
  sudo apt update && sudo apt install docker.io -y
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose

  if ! command -v docker-compose &> /dev/null; then
    log "Unable to install. Install manually."
    exit 1
  fi
fi

# Check if the template file exists
if [ ! -f "$COMPOSE_TEMPLATE" ]; then
  log "Error: Template file '$COMPOSE_TEMPLATE' not found."
  exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  log "Error: .env file not found. Please create one from .env.example"
  exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Generate docker-compose file from template
log "Generating docker-compose file from template..."
envsubst < "$COMPOSE_TEMPLATE" > "$COMPOSE_FILE"

# Start the Nakama service
log "Starting Nakama service..."
log "docker-compose -f "$COMPOSE_FILE" up -d --build"
docker-compose -f "$COMPOSE_FILE" up -d --build

# Check if the command was successful
if [ $? -eq 0 ]; then
  log "Nakama service started successfully."
else
  log "Error: Failed to start Nakama service."
  exit 1
fi

# Display container status
log "Checking container status..."
docker-compose -f "$COMPOSE_FILE" ps