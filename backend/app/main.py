from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import simulate
from app.routes.map_handler import router as map_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update to restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulate.router)
app.include_router(map_router)