FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8

MAINTAINER Amrit Baveja <amrit_baveja@branson.org>

ENV CELERY_TASK_SERIALIZER = 'pickle'

# Install Python Requirements and Clean Up
COPY ./rest_service/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

# Copy code into container
COPY ./rest_service /app
COPY ./shared /app/shared