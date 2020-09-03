FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8
ARG CA_URL="https://storage.googleapis.com/vault-159468-cert-storage/ca.pem"
ENV REQUESTS_CA_BUNDLE='/etc/ssl/certs/ca-certificates.crt'

# Trust Internal CA Certificate
RUN wget -O /usr/share/ca-certificates/ca.crt "$CA_URL" && \
    echo "ca.crt" >> /etc/ca-certificates.conf && \
    update-ca-certificates --fresh

# Install Python Requirements and Clean Up
COPY ./dashboard/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

# Copy code into container
COPY ./dashboard /app
COPY ./shared /app/shared