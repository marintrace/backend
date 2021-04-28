# -*- encoding: utf-8 -*-
from os import environ as env_vars

from backend.asynchronous import ASYNC_ROUTER
from backend.dashboard import DASHBOARD_ROUTER
from backend.user_management import USER_MGMT_ROUTER
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi_utils.timing import add_timing_middleware

from shared.logger import logger

app = FastAPI(
    title="Admin Dashboard",
    debug=env_vars.get("DEBUG", False),
    description="Admin Dashboard for school analytics and tracing information"
)
# Add the middleware to capture the timing of requests
add_timing_middleware(app=app, record=logger.info, exclude='health')

# Serve up static CSS, Images, Fonts and JavaScript
app.mount("/static", StaticFiles(directory="static"), name="static")
# Serve up Jinja2 Templates
templates = Jinja2Templates(directory="templates")


@app.get('/health', description="Returns Bet", response_model=str, status_code=200)
async def health():
    """
    Healthcheck - Bet -- retrieve our healtcheck
    :return: 'Bet'
    """
    return 'Bet'


@app.get('/', description="Render the Home HTML Page", response_model=str, status_code=200)
async def render_home_page(request: Request):
    """
    Render the Home Page
    :return: Rendered HTML
    """
    return templates.TemplateResponse("index.html", dict(request=request))


@app.get("/detail/{email}", description="Render the User HTML page", response_model=str, status_code=200)
async def render_user_page(request: Request, email: str):
    """
    Render the User Detail Page
    :return: Rendered HTML
    """
    return templates.TemplateResponse("user.html", dict(request=request, user_email=email))


@app.get("/manage-users", description="Render the Manage Users HTML page", response_model=str, status_code=200)
async def render_manage_users_page(request: Request):
    """
    Render the manage users page
    :return: Rendered HTML
    """
    return templates.TemplateResponse("manage-users.html", dict(request=request))

app.include_router(
    DASHBOARD_ROUTER,
    prefix="/api",
    tags=['Dashboard']
)

app.include_router(
    ASYNC_ROUTER,
    prefix="/health",
    tags=['Health']
)

app.include_router(
    USER_MGMT_ROUTER,
    prefix='/user',
    tags=['User Management']
)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
