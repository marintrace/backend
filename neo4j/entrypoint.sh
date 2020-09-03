#!/usr/bin/env bash
CERTIFICATES_ROOT="/var/lib/neo4j/certificates/https"

echo "Copying over SSL Certificates from mounted secret"
mkdir -p "$CERTIFICATES_ROOT/trusted" "$CERTIFICATES_ROOT/revoked" # Create mandatory directories

cp /var/run/ssl/neo4j.pem "$CERTIFICATES_ROOT/trusted/public.crt"
cp /var/run/ssl/neo4j.pem "$CERTIFICATES_ROOT/public.crt"
cp /var/run/ssl/neo4j-key.pem "$CERTIFICATES_ROOT/private.key"

echo "Done."

echo "Obtaining Kubernetes Client Token from Vault Server..."
echo "Vault Server is located @ ${VAULT_ADDRESS}"

CLIENT_TOKEN=$(curl --fail --location --request POST "${VAULT_ADDRESS}:8200/v1/auth/kubernetes/login" \
  --header 'Content-Type: application/json' \
  --data-raw "{\"jwt\": \"$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)\", \"role\": \"$VAULT_ROLE\"}" |
  jq .auth.client_token -r)

sleep 1

echo "Obtained Client Token... Retrieving Database Credentials."

DB_SECRET=$(curl --fail --location --request GET "${VAULT_ADDRESS}:8200/v1/secret/data/database" --header X-Vault-Token:"$CLIENT_TOKEN")
DB_USERNAME=$(echo "$DB_SECRET" | jq .data.data.username -r)
DB_PASSWORD=$(echo "$DB_SECRET" | jq .data.data.password -r)

echo "Starting Server..."
export NEO4J_AUTH="$DB_USERNAME/$DB_PASSWORD"
NEO4J_EDITION=4.1 /sbin/tini -g -- /docker-entrypoint.sh neo4j
