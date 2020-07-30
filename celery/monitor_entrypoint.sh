#!/usr/bin/env bash

echo "Vault Server is located @ ${VAULT_ADDRESS}"
echo "Obtaining Kubernetes Client Token from Vault Server for Celery Monitor (Flower)..."

CLIENT_TOKEN=$(curl -k --fail --location --request POST "${VAULT_ADDRESS}:8200/v1/auth/kubernetes/login" \
  --header 'Content-Type: application/json' \
  --data-raw "{\"jwt\": \"$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)\", \"role\": \"$VAULT_ROLE\"}" |
  jq .auth.client_token -r)

sleep 1

echo "Obtained Client Token... Retrieving Database Credentials."

FLOWER_SECRET=$(curl -k --fail --location --request GET "${VAULT_ADDRESS}:8200/v1/secret/data/flower" --header X-Vault-Token:"$CLIENT_TOKEN")
FLOWER_OAUTH2_KEY=$(echo "$FLOWER_SECRET" | jq .data.data.oauth2_client_id -r)
FLOWER_OAUTH2_SECRET=$(echo "$FLOWER_SECRET" | jq .data.data.oauth2_secret -r)
FLOWER_OAUTH2_REDIRECT_URI=$(echo "$FLOWER_SECRET" | jq .data.data.oauth2_redirect_url -r)

export FLOWER_OAUTH2_KEY
export FLOWER_OAUTH2_SECRET
export FLOWER_OAUTH2_REDIRECT_URI

echo "Starting Flower Server..."
celery -A tasks flower --auth="amrit_baveja@branson.org"
