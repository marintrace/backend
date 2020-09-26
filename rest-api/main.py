# -*- coding: utf-8 -*-
"""
FastAPI REST API for processing both synchronous and
asynchronous information from clients
"""
from os import environ as env_vars

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi_utils.timing import add_timing_middleware
from uvicorn import run as run_server

from routers.asynchronous import ASYNC_ROUTER
from routers.synchronous import SYNC_ROUTER
from shared.logger import logger

app = FastAPI(
    title="Contact Tracing API",
    debug=env_vars.get('DEBUG', False),
    description="API for asynchronous and synchronous calls from contact tracing clients"
)
add_timing_middleware(app=app, record=logger.info, exclude='health')
# Add CORS support from production and test domains
app.add_middleware(
    middleware_class=CORSMiddleware,
    allow_origins=[
        'https://api.marintracingapp.org',
        'https://marintracingapp.org',
        'https://bmaapp.de',
        'http://localhost:8090'
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.on_event(event_type='startup')
async def on_startup():
    """
    Runs when the API Server starts up
    """
    logger.info("****** API IS STARTING UP ******")


@app.on_event(event_type='shutdown')
async def on_shutdown():
    """
    Runs when the API Server shuts down
    """
    logger.info("****** API IS SHUTTING DOWN ******")

@app.get('/health', description='Health check', response_model=str, operation_id='healthcheck', tags=['Mgmt'],
         status_code=status.HTTP_200_OK)
async def health_check():
    """
    Returns 'Bet'
    """
    return 'Bet'


app.include_router(
    router=ASYNC_ROUTER,
    tags=['Async']
)

app.include_router(
    router=SYNC_ROUTER,
    tags=['Sync']
)

if __name__ == '__main__':
    run_server(app, host='0.0.0.0', port=8798)
