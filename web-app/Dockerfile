FROM nginx:1.19.2
ARG CA_URL="https://storage.googleapis.com/vault-159468-cert-storage/ca.pem"

# Install Dependencies for Entrypoint
RUN apt-get -y update && \
    apt-get -y install wget curl ca-certificates jq

# Trust Internal CA Certificate
RUN wget -O /usr/share/ca-certificates/ca.crt "$CA_URL" && \
    echo "ca.crt" >> /etc/ca-certificates.conf && \
    update-ca-certificates --fresh

COPY ./config/nginx.conf /etc/nginx/nginx.conf
COPY . /usr/share/nginx/html

# Prevent nginx Conf from being served from nginx
RUN rm -rf /usr/share/nginx/html/config