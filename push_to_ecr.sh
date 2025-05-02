#!/bin/bash
# automatic script from chat, can only be run by sebastian and ryan sorry
set -e  # Exit on error

AWS_ACCOUNT_ID=686728032722
REGION=us-west-2

# Image names
BACKEND_IMAGE_NAME=polling-app
MONGO_IMAGE_NAME=mongo-polling
TAG=latest

# Full ECR URIs
BACKEND_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${BACKEND_IMAGE_NAME}:${TAG}
MONGO_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${MONGO_IMAGE_NAME}:${TAG}

echo "[1/5] Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

echo "[2/5] Building Docker images..."
docker compose build

echo "[3/5] Tagging images for ECR..."
docker tag polling-app $BACKEND_URI
docker tag mongo-polling $MONGO_URI

echo "[4/5] Pushing images to ECR..."
docker push $BACKEND_URI
docker push $MONGO_URI

echo "[5/5] Push complete."
