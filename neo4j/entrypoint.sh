#!/usr/bin/env bash

echo "Vault Server is located @ ${VAULT_ADDRESS}"
echo "Obtaining Kubernetes Client Token from Vault Server..."

CLIENT_TOKEN=$(curl -k --fail --location --request POST "${VAULT_ADDRESS}:8200/v1/auth/kubernetes/login" \
  --header 'Content-Type: application/json' \
  --data-raw "{\"jwt\": \"$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)\", \"role\": \"$VAULT_ROLE\"}" |
  jq .auth.client_token -r)

sleep 1

echo "Obtained Client Token... Retrieving Database Credentials."

DB_SECRET=$(curl -k --fail --location --request GET "${VAULT_ADDRESS}:8200/v1/secret/data/database" --header X-Vault-Token:"$CLIENT_TOKEN")
DB_USERNAME=$(echo "$DB_SECRET" | jq .data.data.username -r)
DB_PASSWORD=$(echo "$DB_SECRET" | jq .data.data.password -r)

echo "Starting Server..."
export NEO4J_AUTH="$DB_USERNAME/$DB_PASSWORD"
/sbin/tini -g -- /docker-entrypoint.sh neo4j
