from abc import ABC, abstractmethod
from typing import List, Dict, Any, AsyncGenerator, Optional, Tuple
from app.utils.logger import get_logger

logger = get_logger(__name__)

class BaseModelService(ABC):
    """
    Base abstract class for all model provider services.
    
    This class defines the interface that all model provider services must implement.
    It also provides some common utility methods.
    """
    
    def __init__(self):
        """Initialize the service with common resources"""
        self.logger = get_logger(self.__class__.__name__)
    
    @abstractmethod
    async def generate_text(
        self, 
        model_id: str, 
        prompt: str, 
        temperature: float = 0.7, 
        max_tokens: int = 1024
    ) -> str:
        """
        Generate text from a prompt (non-streaming)
        
        Args:
            model_id: ID of the model to use
            prompt: Input text prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            
        Returns:
            Generated text response
        """
        pass
    
    @abstractmethod
    async def generate_stream(
        self, 
        model_id: str, 
        prompt: str, 
        temperature: float = 0.7, 
        max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming text from a prompt
        
        Args:
            model_id: ID of the model to use
            prompt: Input text prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            
        Yields:
            Text chunks as they are generated
        """
        pass
    
    @abstractmethod
    async def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Get a list of available models from this provider
        
        Returns:
            List of model information dictionaries
        """
        pass
    
    def get_model_id_from_full_id(self, full_id: str) -> str:
        """
        Extract the actual model ID from a full ID that may include provider prefix
        
        Args:
            full_id: Full model ID which may include provider prefix (e.g., 'ollama/llama2')
            
        Returns:
            Model ID without provider prefix
        """
        if '/' in full_id:
            return full_id.split('/', 1)[1]
        return full_id
    
    def log_request(self, model_id: str, prompt: str, params: Dict[str, Any]) -> None:
        """
        Log model request details
        
        Args:
            model_id: ID of the model being used
            prompt: The prompt being sent (may be truncated for logging)
            params: Additional parameters for the request
        """
        # Truncate prompt for logging
        truncated_prompt = prompt[:100] + "..." if len(prompt) > 100 else prompt
        
        self.logger.info(f"Request to model {model_id}")
        self.logger.debug(f"Prompt: {truncated_prompt}")
        self.logger.debug(f"Parameters: {params}")
    
    def log_response(self, model_id: str, response: str) -> None:
        """
        Log model response details
        
        Args:
            model_id: ID of the model used
            response: The response received (may be truncated for logging)
        """
        # Truncate response for logging
        truncated_response = response[:100] + "..." if len(response) > 100 else response
        
        self.logger.info(f"Response from model {model_id}")
        self.logger.debug(f"Response: {truncated_response}")
    
    def log_error(self, model_id: str, error: Exception) -> None:
        """
        Log model error details
        
        Args:
            model_id: ID of the model used
            error: The exception that occurred
        """
        self.logger.error(f"Error with model {model_id}: {str(error)}")
        self.logger.exception(error) 