FROM python:3.6-alpine

ENV CELERY_BROKER_URL redis://redis:6379/0
ENV CELERY_RESULT_BACKEND redis://redis:6379/0
ENV C_FORCE_ROOT true

COPY ./celery/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt

COPY ./celery/lib /celery
COPY ./shared /celery/shared
WORKDIR /celery

ENTRYPOINT celery -A tasks worker --loglevel=info