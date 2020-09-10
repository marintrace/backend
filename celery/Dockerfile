FROM python:3.6-alpine
ARG CA_URL="https://storage.googleapis.com/vault-159468-cert-storage/ca.pem"
ENV REQUESTS_CA_BUNDLE='/etc/ssl/certs/ca-certificates.crt'

# Install APK dependencies
RUN apk update && \
    apk add gcc musl-dev jq curl ca-certificates wget

# Trust Internal CA Certificate
RUN wget -O /usr/share/ca-certificates/ca.crt "$CA_URL" && \
    echo "ca.crt" >> /etc/ca-certificates.conf && \
    update-ca-certificates --fresh

# Install Python Dependencies and Clean up
COPY ./celery/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt && \
    rm  /tmp/requirements.txt

# Copy code into container
COPY ./celery /app
COPY ./shared /app/shared

# Make Monitor Entrypoint Executable
RUN chmod +x /app/monitor_entrypoint.sh

WORKDIR /app