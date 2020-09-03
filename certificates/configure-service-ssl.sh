#!/bin/bash

if [[ -z "$1" ]]; then
  echo "ERROR: Service name must be specified."
  exit 1
fi

echo "Generating CSR and PEM for service $1..."
cat <<EOF | cfssl gencert -ca=authority/ca.pem -ca-key=authority/ca-key.pem - | cfssljson -bare $1
{
  "hosts": [
    "tracing-$1.default.svc.cluster.local",
    "10.0.0.1",
    "127.0.0.1",
    "tracing-$1"
  ],
  "CN": "tracing-$1.default.svc.cluster.local",
  "key": {
    "algo": "ecdsa",
    "size": 256
  }
}
EOF

echo "Generating Kubernetes Secret"

cat <<EOF > "$1"-ssl-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  creationTimestamp: null
  name: {{ template "$1.fullname" . }}-ssl
data:
  ca.pem: $(base64 < authority/ca.pem )
  $1-key.pem: $(base64 < $1-key.pem )
  $1.pem: $(base64 < $1.pem)
EOF

echo "Created $1-ssl-secret.yaml."
