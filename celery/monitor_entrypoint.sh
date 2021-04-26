#!/usr/bin/env bash
#!/usr/bin/env bash
echo "Obtaining Kubernetes Client Token from Vault Server..."
echo "Vault Server is located @ ${VAULT_ADDRESS}"

CLIENT_TOKEN=$(curl --fail --location --request POST "${VAULT_ADDRESS}:8200/v1/auth/kubernetes/login" \
  --header 'Content-Type: application/json' \
  --data-raw "{\"jwt\": \"$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)\", \"role\": \"$VAULT_ROLE\"}" |
  jq .auth.client_token -r)

sleep 1

echo "Obtained Client Token... Retrieving Flower Basic Auth Credentials."

FLOWER_SECRET=$(curl --fail --location --request GET "${VAULT_ADDRESS}:8200/v1/secret/data/flower" \
  --header X-Vault-Token:"$CLIENT_TOKEN")

FLOWER_USERNAME=$(echo "$FLOWER_SECRET" | jq .data.data.username -r)
FLOWER_PASSWORD=$(echo "$FLOWER_SECRET" | jq .data.data.password -r)

echo "Starting Server..."
celery -A tasks flower --basic_auth="$FLOWER_USERNAME:$FLOWER_PASSWORD" --keyfile=/var/run/ssl/flower-key.pem --certfile=/var/run/ssl/flower.pem
