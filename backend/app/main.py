# app/main.py

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import chat, models, settings
from app.config import settings as app_settings
import logging
import time
from typing import Callable, Dict, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO if app_settings.DEBUG else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Output to console
    ]
)

logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    """Create and configure the FastAPI application.
    
    Returns:
        FastAPI: The configured FastAPI application instance
    """
    # Create the app
    app = FastAPI(
        title="FI - Your Fast Intelligence Companion",
        description="A minimalist chat interface for various LLM models",
        version="0.2.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json"
    )
    
    # Add middleware for request timing and logging
    @app.middleware("http")
    async def log_and_time_requests(request: Request, call_next: Callable) -> JSONResponse:
        """Log all incoming requests and their timing.
        
        Args:
            request: The incoming request
            call_next: The next middleware or route handler
            
        Returns:
            JSONResponse: The response from the route handler or error response
        """
        start_time = time.time()
        logger.info(f"Request: {request.method} {request.url}")
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            logger.info(f"Response status: {response.status_code} - Took {process_time:.4f}s")
            # Add processing time header to response
            response.headers["X-Process-Time"] = f"{process_time:.4f}"
            return response
        except Exception as e:
            logger.error(f"Request failed: {str(e)}")
            process_time = time.time() - start_time
            error_response = JSONResponse(
                status_code=500,
                content={"detail": f"Internal server error: {str(e)}"},
            )
            error_response.headers["X-Process-Time"] = f"{process_time:.4f}"
            return error_response
    
    # Add exception handlers
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        """Handle HTTP exceptions.
        
        Args:
            request: The request that caused the exception
            exc: The HTTP exception
            
        Returns:
            JSONResponse: JSON response with the error details
        """
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle general exceptions.
        
        Args:
            request: The request that caused the exception
            exc: The exception
            
        Returns:
            JSONResponse: JSON response with the error details
        """
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(exc)}"},
        )
    
    # Setup CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(models.router, prefix="/api", tags=["models"])
    app.include_router(chat.router, prefix="/api", tags=["chat"])
    app.include_router(settings.router, prefix="/api", tags=["settings"])
    
    # Health check endpoint
    @app.get("/health")
    async def health_check() -> Dict[str, str]:
        """Health check endpoint to verify API is running.
        
        Returns:
            Dict[str, str]: Status information
        """
        return {"status": "ok", "version": "0.2.0"}
    
    return app

# Create the app instance
app = create_app()

# Run the application directly when this file is executed
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=app_settings.DEBUG)