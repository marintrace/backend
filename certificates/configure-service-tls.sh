#!/bin/bash

if [[ -z "$1" ]]; then
  echo "No Service Specified... Generating Client Certificate"
  SVC="client"
  HOSTS=""
else
  SVC="$1"
  HOSTS=$(cat <<EOF
    "hosts": [
    "tracing-$1.default.svc.cluster.local",
    "10.0.0.1",
    "127.0.0.1",
    "localhost",
    "tracing-$1"
  ],
  )
fi

echo "Generating CSR and PEM for service $1..."
cat <<EOF | cfssl gencert -config=cert-config.json -ca=authority/ca.pem -ca-key=authority/ca-key.pem - | cfssljson -bare $SVC
{
  $HOSTS
  "names": [
    {
      "C": "US",
      "L": "San Francisco",
      "O": "Marin Tracing",
      "ST": "CA",
      "OU": "$SVC"
    }
  ],
  "CN": "tracing-$SVC.default.svc.cluster.local",
  "key": {
    "algo": "ecdsa",
    "size": 256
  }
}
EOF

echo "Generating Kubernetes Secret"

cat <<EOF >"$SVC"-tls-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  creationTimestamp: null
  name: {{ template "$SVC.fullname" . }}-tls
data:
  ca.pem: $(base64 <authority/ca.pem)
  $SVC-key.pem: $(base64 <$SVC-key.pem)
  $SVC.pem: $(base64 <$SVC.pem)
EOF

echo "Created $SVC-tls-secret.yaml."
