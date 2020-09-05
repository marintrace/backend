FROM golang:1.14.4 AS build-env
ARG SOURCE=*

ADD $SOURCE /src/
WORKDIR /src/

# Unpack any tars, then try to execute a Makefile, but if the SOURCE url is
# just a tar of binaries, then there probably won't be one. Using multiple RUN
# commands to ensure any errors are caught.
RUN find . -name '*.tar.gz' -type f | xargs -rn1 tar -xzf
RUN if [ -f Makefile ]; then make; fi
RUN cp "$(find . -name 'louketo-proxy' -type f -print -quit)" /louketo-proxy

FROM ubuntu:18.04
ARG CA_URL="https://storage.googleapis.com/vault-159468-cert-storage/ca.pem"
WORKDIR "/opt/louketo"

# Install Utilities Required for Entrypoint
RUN apt-get -y update && \
    apt-get install -y curl jq wget ca-certificates

# Trust Internal CA Certificate
RUN wget -O /usr/share/ca-certificates/ca.crt "$CA_URL" && \
    echo "ca.crt" >> /etc/ca-certificates.conf && \
    update-ca-certificates --fresh

# Copy Required Config and Source Files
COPY templates ./templates
COPY entrypoint.sh ./entrypoint.sh

# Copy built Go Binaries
COPY --from=build-env /louketo-proxy ./


# Make files executable
RUN chmod +x louketo-proxy && \
    chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
