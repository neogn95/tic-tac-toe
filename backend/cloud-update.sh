#!/bin/bash

sudo docker build -t neogn95/nakama-build:latest . --no-cache

docker service update --force nakama_stack_nakama