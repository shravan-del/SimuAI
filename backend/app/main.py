from fastapi import FastAPI
from app.routes import simulate

app = FastAPI()
app.include_router(simulate.router)