FROM sethvargo/vault-init

COPY ./config /config
ENV GOOGLE_APPLICATION_CREDENTIALS "/config/vault-service-account.json"

ENTRYPOINT ["vault-init"]