FROM python:3.6-alpine

# Install APK dependencies
RUN apk update && \
    apk add gcc musl-dev jq curl ca-certificates wget

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