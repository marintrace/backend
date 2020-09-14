FROM rabbitmq:3-management
ARG CA_URL="https://storage.googleapis.com/vault-159468-cert-storage/ca.pem"

# Install Dependencies for Entrypoint
RUN apt-get -y update && \
    apt-get -y install wget curl ca-certificates jq

# Trust Internal CA Certificate
RUN wget -O /usr/share/ca-certificates/ca.crt "$CA_URL" && \
    echo "ca.crt" >> /etc/ca-certificates.conf && \
    update-ca-certificates --fresh

# Setup RabbitMQ
COPY ./rabbitmq.conf /etc/rabbitmq/rabbitmq.conf
COPY ./entrypoint.sh /entrypoint.sh

# Setup Permissions
RUN chmod +x /entrypoint.sh && \
    chmod 755 /etc/rabbitmq/rabbitmq.conf

USER rabbitmq
CMD ["/entrypoint.sh"]

