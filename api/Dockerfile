FROM tiangolo/uwsgi-nginx-flask:python3.8

COPY ./api/requirements.txt /tmp/requirements.txt
RUN pip install -r requirements.txt

COPY ./api/lib /app
COPY ./shared /app/shared