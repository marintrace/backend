FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8
ARG CA_URL="https://storage.googleapis.com/vault-159468-cert-storage/ca.pem"
ENV REQUESTS_CA_BUNDLE='/etc/ssl/certs/ca-certificates.crt'

# Install Python Requirements and Clean Up
COPY ./rest-api/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

# Trust Internal CA Certificate
RUN wget -O /usr/share/ca-certificates/ca.crt "$CA_URL" && \
    echo "ca.crt" >> /etc/ca-certificates.conf && \
    update-ca-certificates --fresh

# Copy code into container
COPY ./rest-api /app
COPY ./shared /app/shared