FROM python:3.6-alpine

MAINTAINER Amrit Baveja <amrit_baveja@branson.org>

# Setup Celery Configuration
ENV CELERY_BROKER_URL redis://redis:6379/0
ENV CELERY_RESULT_BACKEND redis://redis:6379/0
ENV C_FORCE_ROOT true

# Install C compiler
RUN apk update && \
    apk add gcc musl-dev

# Install Python Dependencies and Clean up
COPY ./worker_service/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt && \
    rm  /tmp/requirements.txt

# Copy code into container
COPY ./worker_service /app
COPY ./shared /app/shared
WORKDIR /app