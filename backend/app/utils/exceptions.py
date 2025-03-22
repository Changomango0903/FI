from fastapi import HTTPException, status
from typing import Any, Dict, Optional

class BaseAppException(Exception):
    """Base exception class for all application exceptions"""
    
    def __init__(
        self, 
        message: str, 
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)
    
    def to_http_exception(self) -> HTTPException:
        """Convert to FastAPI HTTPException for returning to client"""
        return HTTPException(
            status_code=self.status_code,
            detail={
                "message": self.message,
                "details": self.details
            }
        )


class ConfigurationError(BaseAppException):
    """Exception raised for configuration issues"""
    
    def __init__(
        self, 
        message: str, 
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


class ValidationError(BaseAppException):
    """Exception raised for input validation issues"""
    
    def __init__(
        self, 
        message: str, 
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class ModelServiceError(BaseAppException):
    """Exception raised for model service issues"""
    
    def __init__(
        self, 
        message: str, 
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details
        )


class ModelNotFoundError(BaseAppException):
    """Exception raised when a requested model is not found"""
    
    def __init__(
        self, 
        model_id: str,
        provider: Optional[str] = None
    ):
        provider_str = f" from provider '{provider}'" if provider else ""
        super().__init__(
            message=f"Model '{model_id}'{provider_str} not found",
            status_code=status.HTTP_404_NOT_FOUND,
            details={
                "model_id": model_id,
                "provider": provider
            }
        )


class ContextLimitExceededError(BaseAppException):
    """Exception raised when the context window limit is exceeded"""
    
    def __init__(
        self, 
        token_count: int,
        context_window: int,
        model_id: str
    ):
        super().__init__(
            message=f"Context limit exceeded for model '{model_id}': {token_count} tokens (limit: {context_window})",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={
                "token_count": token_count,
                "context_window": context_window,
                "model_id": model_id,
                "usage_percentage": (token_count / context_window) * 100
            }
        ) 