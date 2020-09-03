FROM neo4j:4.1
ARG CA_URL="https://storage.googleapis.com/vault-159468-cert-storage/ca.pem"

# Install CLI for Entrypoint
RUN apt-get -y update && \
    apt-get install -y curl wget jq ca-certificates

# Trust Internal CA Certificate
RUN wget -O /usr/share/ca-certificates/ca.crt "$CA_URL" && \
    echo "ca.crt" >> /etc/ca-certificates.conf && \
    update-ca-certificates --fresh

COPY entrypoint.sh /config/entrypoint.sh
RUN chmod +x /config/entrypoint.sh


CMD ["/config/entrypoint.sh"]