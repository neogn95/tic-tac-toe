#!/bin/bash

# Get the external IP of the VM
COMPOSE_TEMPLATE="docker-compose-scale.yml.template"
COMPOSE_FILE="docker-compose-scale.yml"
VM_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google")

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

# Check if Docker Swarm is already initialized
if ! docker info | grep -q "Swarm: active"; then
    echo "Initializing Docker Swarm..."
    docker swarm init --advertise-addr "$VM_IP"
else
    echo "Docker Swarm already initialized."
fi

# Build the Nakama Docker image
echo "Building Nakama image..."
docker build -t nakama-build .

# Deploy the stack using the compose file
echo "Deploying Nakama stack..."
docker stack deploy -c docker-compose-scale.yml nakama_stack

echo "Deployment complete!"

echo "Scaling Nakama instances..."
docker service scale nakama_stack_nakama=2