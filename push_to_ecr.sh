#!/bin/bash
# automatic script from chat, can only be run by sebastian and ryan sorry

set -e  # Exit on error

AWS_ACCOUNT_ID=686728032722
REGION=us-west-2
TAG=latest

# Image names
BACKEND_IMAGE_NAME=polling-app
MONGO_IMAGE_NAME=mongo-polling
FRONTEND_IMAGE_NAME=frontend-polling

# Full ECR URIs
BACKEND_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${BACKEND_IMAGE_NAME}:${TAG}
MONGO_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${MONGO_IMAGE_NAME}:${TAG}
FRONTEND_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${FRONTEND_IMAGE_NAME}:${TAG}

echo "[1/6] Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

echo "[2/6] Building Docker images..."
docker compose build

echo "[3/6] Tagging images for ECR..."
docker tag polling-app $BACKEND_URI
docker tag mongo-polling $MONGO_URI
docker tag polling-frontend $FRONTEND_URI

echo "[4/6] Pushing images to ECR..."
docker push $BACKEND_URI
docker push $MONGO_URI
docker push $FRONTEND_URI

echo "[5/6] Verifying pushed images..."
docker images | grep "${AWS_ACCOUNT_ID}"

echo "[6/6] Push complete."