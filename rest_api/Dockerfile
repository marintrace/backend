FROM tiangolo/uvicorn-gunicorn-fastapi:python3.8

# Install Python Requirements and Clean Up
COPY ./rest_api/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt

# Copy code into container
COPY ./rest_api /app
COPY ./shared /app/shared