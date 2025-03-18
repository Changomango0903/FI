from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat, models, settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Output to console
    ]
)

logger = logging.getLogger(__name__)

# Add this line to the top of your app initialization
app = FastAPI(
    title="FI - Your Fast Intelligence Companion",
    description="A minimalist chat interface for various LLM models",
    version="0.1.0"
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(models.router, prefix="/api", tags=["models"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(settings.router, prefix="/api", tags=["settings"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)