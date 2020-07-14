FROM alpine:3.11

ENV VAULT_VERSION 1.4.0

RUN mkdir -p /vault/config

RUN apk --no-cache add bash ca-certificates wget

# download and set up vault_roles
RUN wget --quiet --output-document=/tmp/vault.zip https://releases.hashicorp.com/vault/${VAULT_VERSION}/vault_${VAULT_VERSION}_linux_amd64.zip && \
    unzip /tmp/vault.zip -d /vault && \
    rm -f /tmp/vault.zip && \
    chmod +x /vault

# add the vault_roles file
COPY ./config /vault/config

ENV PATH="PATH=$PATH:$PWD/vault"
ENV GOOGLE_APPLICATION_CREDENTIALS "/vault/config/vault-service-account.json"

EXPOSE 8200
CMD ["vault", "server", "-config=/vault/config/vault_config.hcl"]
