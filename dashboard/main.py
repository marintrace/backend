# -*- encoding: utf-8 -*-
from fastapi import FastAPI, Request
from os import environ as env_vars
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from backend.data_retrievers import BACKEND_ROUTER

app = FastAPI(
    title="Admin Dashboard",
    debug=env_vars.get("DEBUG", False),
    description="Admin Dashboard for school analytics and tracing information"
)

# Serve up static CSS, Images, Fonts and JavaScript
app.mount("/static", StaticFiles(directory="static"), name="static")
# Serve up Jinja2 Templates
templates = Jinja2Templates(directory="templates")


@app.get('/health', description="Returns Bet", response_model=str, status_code=200)
async def health():
    """
    Healthcheck - Bet
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
    return templates.TemplateResponse("user.html", dict(request=request, user=email))


app.include_router(
    BACKEND_ROUTER,
    prefix="/api"
)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
