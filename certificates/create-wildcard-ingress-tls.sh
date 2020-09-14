#!/bin/bash

if [[ -z "$1" ]]; then
  echo "ERROR: Domain name must be specified."
  exit 1
fi

echo "Generating CSR and PEM for service $1..."
cat <<EOF | cfssl gencert -ca=authority/ca.pem -ca-key=authority/ca-key.pem - | cfssljson -bare $1
{
  "hosts": [
    "*.$1",
    "$1"
  ],
  "CN": "$1",
  "key": {
    "algo": "ecdsa",
    "size": 384
  }
}
EOF

echo "Generating Kubernetes Secret"

cat <<EOF > ingress-tls-secret.yaml
apiVersion: v1
kind: Secret
type: kubernetes.io/tls
metadata:
  creationTimestamp: null
  name: ingress-tls
data:
  ca.pem: $(base64 < authority/ca.pem )
  tls.key: $(base64 < $1-key.pem )
  tls.crt: $(base64 < $1.pem)
EOF

echo "Created $1-ssl-secret.yaml."
