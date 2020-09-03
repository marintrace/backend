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

FROM centos:centos7
ARG CA_URL="https://storage.googleapis.com/vault-159468-cert-storage/ca.pem"
WORKDIR "/opt/louketo"

# Install Utilities Required for Entrypoint
RUN yum -y install curl jq wget

# Trust Internal CA Certificate
RUN wget -O /etc/pki/ca-trust/source/anchors/ca.crt "$CA_URL" && \
    update-ca-trust extract

# Setup Proxy Security
RUN echo "louketo:x:1000:louketo" >> /etc/group && \
    echo "louketo:x:1000:1000:louketo user:/opt/louketo:/sbin/nologin" >> /etc/passwd && \
    chown -R louketo:louketo /opt/louketo && \
    chmod -R g+rw /opt/louketo

# Copy Required Config and Source Files
COPY templates ./templates
COPY entrypoint.sh ./entrypoint.sh

# Copy built Go Binaries
COPY --from=build-env /louketo-proxy ./


# Make files executable
RUN chmod +x louketo-proxy && \
    chmod +x entrypoint.sh

USER 1000
CMD ["./entrypoint.sh"]
