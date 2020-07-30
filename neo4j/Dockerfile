FROM neo4j:3.5

RUN apt-get -y update && \
    apt-get install -y curl jq ca-certificates

COPY entrypoint.sh /config/entrypoint.sh
RUN chmod +x /config/entrypoint.sh


CMD ["/config/entrypoint.sh"]