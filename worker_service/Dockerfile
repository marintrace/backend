FROM python:3.6-alpine

# Setup Celery Configuration
ENV CELERY_BROKER_URL redis://redis:6379/0
ENV CELERY_RESULT_BACKEND redis://redis:6379/0
ENV C_FORCE_ROOT true

# Install Python Dependencies and Clean up
COPY ./worker_service/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt && \
    rm  /tmp/requirements.txt

# Copy code into container
COPY ./worker_service /opt/app
COPY ./shared /opt/app/shared
WORKDIR /opt/app

ENTRYPOINT celery -A tasks worker --loglevel=info