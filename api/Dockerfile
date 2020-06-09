FROM tiangolo/meinheld-gunicorn-flask:python3.8

COPY ./api/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt

COPY ./api/lib /app
COPY ./shared /app/shared

RUN echo $NEO4J_HOST