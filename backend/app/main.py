from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging
import argparse

from app.config import settings, configure_logging
from app.utils.logger import get_logger
from app.routes import chat, models, settings as settings_routes, context, projects
from app.utils.error_handlers import register_exception_handlers

# Configure global logging
configure_logging()
logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging request details and timing"""
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP address
        client_host = request.client.host if request.client else "unknown"
        
        # Log request details
        logger.info(f"Request: {request.method} {request.url.path} from {client_host}")
        
        # Measure request processing time
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log response details
        logger.info(f"Response: {response.status_code} for {request.url.path} took {process_time:.3f}s")
        
        return response


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application
    
    Returns:
        Configured FastAPI application
    """
    # Create FastAPI app with metadata
    app = FastAPI(
        title="FI - Your Fast Intelligence Companion",
        description="A minimalist chat interface for various LLM models",
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json"
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Frontend URLs
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Add request logging middleware
    app.add_middleware(RequestLoggingMiddleware)
    
    # Register exception handlers
    register_exception_handlers(app)
    
    # Include routers with appropriate prefixes
    app.include_router(models.router, prefix=settings.API_PREFIX, tags=["models"])
    app.include_router(chat.router, prefix=settings.API_PREFIX, tags=["chat"])
    app.include_router(settings_routes.router, prefix=settings.API_PREFIX, tags=["settings"])
    app.include_router(context.router, prefix=settings.API_PREFIX, tags=["context"])
    app.include_router(projects.router, prefix=settings.API_PREFIX, tags=["projects"])
    
    # Health check endpoint
    @app.get("/health", tags=["health"])
    async def health_check():
        """Health check endpoint for monitoring"""
        return {"status": "ok", "version": app.version}
    
    # Startup and shutdown events
    @app.on_event("startup")
    async def startup_event():
        """Application startup tasks"""
        logger.info(f"Starting Fast Intelligence API v{app.version}")
        
    @app.on_event("shutdown")
    async def shutdown_event():
        """Application shutdown tasks"""
        logger.info("Shutting down Fast Intelligence API")
    
    return app


# Create application instance
app = create_app()


# For direct execution
if __name__ == "__main__":
    import uvicorn
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Start the Fast Intelligence API server")
    parser.add_argument("--host", type=str, default=settings.API_HOST, 
                        help=f"Host to bind to (default: {settings.API_HOST})")
    parser.add_argument("--port", type=int, default=settings.API_PORT, 
                        help=f"Port to bind to (default: {settings.API_PORT})")
    parser.add_argument("--reload", action="store_true", default=settings.API_DEBUG,
                        help="Enable auto-reload on code changes")
    args = parser.parse_args()
    
    logger.info(f"Starting development server on {args.host}:{args.port}")
    uvicorn.run(
        "app.main:app", 
        host=args.host, 
        port=args.port, 
        reload=args.reload,
        log_level=settings.LOG_LEVEL.lower()
    )