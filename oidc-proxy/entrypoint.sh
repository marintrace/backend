#!/usr/bin/env bash

echo "Vault Server is located @ ${VAULT_ADDRESS}"
echo "Obtaining Kubernetes Client Token from Vault Server..."

CLIENT_TOKEN=$(curl -k --fail --location --request POST "${VAULT_ADDRESS}:8200/v1/auth/kubernetes/login" \
  --header 'Content-Type: application/json' \
  --data-raw "{\"jwt\": \"$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)\", \"role\": \"$VAULT_ROLE\"}" |
  jq .auth.client_token -r)

sleep 1

echo "Obtained Client Token... Retrieving OIDC Configuration"

OIDC_SECRET=$(curl -k --fail --location --request GET "${VAULT_ADDRESS}:8200/v1/secret/data/oidc/admin-lock" --header X-Vault-Token:"$CLIENT_TOKEN")
CLIENT_ID=$(echo "$OIDC_SECRET" | jq .data.data.client_id -r)
CLIENT_SECRET=$(echo "$OIDC_SECRET" | jq .data.data.client_secret -r)
DISCOVERY_URL=$(echo "$OIDC_SECRET" | jq .data.data.discovery_url -r)
MATCH_CLAIMS=$(echo "$OIDC_SECRET" | jq .data.data.match_claims -r)

echo "Starting Louketo Proxy"
# SSL Termination is at the Ingress Level
/opt/louketo/louketo-proxy \
  --listen 0.0.0.0:80 \
  --upstream-url http://tracing-admin \
  --discovery-url "$DISCOVERY_URL" \
  --client-id "$CLIENT_ID" \
  --client-secret "$CLIENT_SECRET" \
  --preserve-host \
  --match-claims="$MATCH_CLAIMS" \
  --oauth-uri "$INGRESS_BASE/oauth" \
  --enable-logout-redirect