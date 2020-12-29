# -*- encoding: utf-8 -*-
from os import environ as env_vars

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi_utils.timing import add_timing_middleware

from backend.data_retrievers import BACKEND_ROUTER
from shared.logger import logger
from shared.service.jwt_auth_config import JWTAuthManager

app = FastAPI(
    title="Admin Dashboard",
    debug=env_vars.get("DEBUG", False),
    description="Admin Dashboard for school analytics and tracing information"
)

# JWT Authentication Manager
AUTH_MANAGER = JWTAuthManager(oidc_vault_secret="oidc/admin-jwt",
                              object_creator=lambda claims, role: AdminDashboardUser(
                                  last_name=claims['family_name'],
                                  first_name=claims['given_name'],
                                  email=claims['email'],
                                  school=role.split('-')[0]
                              ))

OIDC_COOKIE = AUTH_MANAGER.auth_cookie('kc-access')  # KeyCloak Access Token set by OIDC Proxy (Auth0 Lock)

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


@app.get("/user/{email}", description="Render the User HTML page", response_model=str, status_code=200)
async def render_user_page(request: Request, email: str):
    """
    Render the User Page
    :return: Rendered HTML
    """
    return templates.TemplateResponse("user.html", dict(request=request, user_email=email))


app.include_router(
    BACKEND_ROUTER,
    prefix="/api"
)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
