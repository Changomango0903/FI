from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
from typing import Any, Dict

from app.utils.exceptions import BaseAppException
from app.utils.logger import get_logger

logger = get_logger(__name__)

async def handle_app_exception(request: Request, exc: BaseAppException) -> JSONResponse:
    """
    Handle all application-specific exceptions
    
    Args:
        request: The request that caused the exception
        exc: The application exception
        
    Returns:
        JSONResponse with appropriate status code and error details
    """
    # Log the exception with varying severity based on status code
    if exc.status_code >= 500:
        logger.error(f"Application error: {exc.message}")
        logger.error(f"Exception details: {exc.details}")
    elif exc.status_code >= 400:
        logger.warning(f"Client error: {exc.message}")
        logger.warning(f"Exception details: {exc.details}")
    else:
        logger.info(f"Handled exception: {exc.message}")
        
    # Return a structured error response
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "details": exc.details,
            "path": request.url.path
        }
    )

async def handle_validation_exception(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle Pydantic validation errors
    
    Args:
        request: The request that caused the exception
        exc: The validation exception
        
    Returns:
        JSONResponse with 422 status code and validation error details
    """
    # Extract validation error details
    errors = []
    for error in exc.errors():
        location = error.get("loc", [])
        location_str = " -> ".join(str(loc) for loc in location)
        errors.append({
            "location": location_str,
            "message": error.get("msg", "Validation error"),
            "type": error.get("type", "unknown")
        })
    
    # Log the validation errors
    logger.warning(f"Validation error at {request.url.path}")
    for error in errors:
        logger.warning(f"  - {error['location']}: {error['message']}")
    
    # Return a structured validation error response
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "message": "Validation error",
            "details": {
                "errors": errors
            },
            "path": request.url.path
        }
    )

async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Handle standard HTTP exceptions
    
    Args:
        request: The request that caused the exception
        exc: The HTTP exception
        
    Returns:
        JSONResponse with appropriate status code and error message
    """
    # Log the HTTP exception
    if exc.status_code >= 500:
        logger.error(f"HTTP error {exc.status_code} at {request.url.path}: {exc.detail}")
    elif exc.status_code >= 400:
        logger.warning(f"HTTP error {exc.status_code} at {request.url.path}: {exc.detail}")
    else:
        logger.info(f"HTTP status {exc.status_code} at {request.url.path}: {exc.detail}")
    
    # Return a structured HTTP error response
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": str(exc.detail),
            "path": request.url.path
        }
    )

async def handle_general_exception(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler for unexpected exceptions
    
    Args:
        request: The request that caused the exception
        exc: The unexpected exception
        
    Returns:
        JSONResponse with 500 status code and error details
    """
    # Get exception details including traceback
    error_details = {
        "type": type(exc).__name__,
        "message": str(exc)
    }
    
    # Log the unexpected exception
    logger.error(f"Unexpected error at {request.url.path}: {exc}")
    logger.error(traceback.format_exc())
    
    # Return a structured error response
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "message": "Internal server error",
            "details": error_details,
            "path": request.url.path
        }
    )

def register_exception_handlers(app) -> None:
    """
    Register all exception handlers with the FastAPI application
    
    Args:
        app: The FastAPI application instance
    """
    # Register handlers for specific exception types
    app.add_exception_handler(BaseAppException, handle_app_exception)
    app.add_exception_handler(RequestValidationError, handle_validation_exception) 
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)
    
    # Catch-all handler for unexpected exceptions
    app.add_exception_handler(Exception, handle_general_exception) 