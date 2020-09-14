#!/usr/bin/env bash
echo "Obtaining Kubernetes Client Token from Vault Server..."
echo "Vault Server is located @ ${VAULT_ADDRESS}"

CLIENT_TOKEN=$(curl --fail --location --request POST "${VAULT_ADDRESS}:8200/v1/auth/kubernetes/login" \
  --header 'Content-Type: application/json' \
  --data-raw "{\"jwt\": \"$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)\", \"role\": \"$VAULT_ROLE\"}" |
  jq .auth.client_token -r)

sleep 1

echo "Obtained Client Token... Retrieving RabbitMQ Credentials."

RMQ_SECRET=$(curl --fail --location --request GET "${VAULT_ADDRESS}:8200/v1/secret/data/rabbitmq" \
  --header X-Vault-Token:"$CLIENT_TOKEN")

export RABBITMQ_DEFAULT_USER=$(echo "$RMQ_SECRET" | jq .data.data.username -r)
export RABBITMQ_DEFAULT_PASS=$(echo "$RMQ_SECRET" | jq .data.data.password -r)
export RABBITMQ_DEFAULT_VHOST=$(echo "$RMQ_SECRET" | jq .data.data.vhost -r)
#export RABBITMQ_ERLANG_COOKIE=$(echo "$RMQ_SECRET" | jq .data.data.erlang_cookie -r)

echo "Starting Server..."
docker-entrypoint.sh rabbitmq-server
