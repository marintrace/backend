FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8

# Install Python Requirements and Clean Up
COPY ./dashboard/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

# Copy code into container
COPY ./dashboard /app
COPY ./shared /app/shared