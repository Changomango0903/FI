# app/services/chat_service.py

from app.services.hf_service import HuggingFaceService
from app.services.ollama_service import OllamaService
from typing import Dict, List, Any, AsyncGenerator, Optional, Tuple, Protocol
import logging

# Configure logger for this module
logger = logging.getLogger(__name__)

class ModelServiceProtocol(Protocol):
    """Protocol defining the interface for model services."""
    
    async def generate_text(self, model_id: str, prompt: str, params: Dict[str, Any]) -> str:
        """Generate text using a model."""
        ...
    
    async def generate_stream(self, model_id: str, prompt: str, params: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """Stream text generation using a model."""
        ...

class ChatService:
    """Service for handling chat interactions with different model providers.
    
    Provides a unified interface for text generation using multiple model providers.
    """
    
    def __init__(self):
        """Initialize chat service with model provider services."""
        self.hf_service = HuggingFaceService()
        self.ollama_service = OllamaService()
        
        # Map of provider names to service instances
        self.provider_services: Dict[str, ModelServiceProtocol] = {
            "huggingface": self.hf_service,
            "ollama": self.ollama_service
        }
    
    def _format_messages(self, provider: str, model_id: str, messages: List[Dict[str, str]]) -> str:
        """Format messages according to the provider's expected format.
        
        Args:
            provider: The model provider (e.g., "huggingface", "ollama")
            model_id: The ID of the model
            messages: List of message dictionaries with "role" and "content" keys
            
        Returns:
            Formatted text string ready for the model
            
        Raises:
            ValueError: If an unsupported provider is specified
        """
        logger.info(f"Formatting messages for {provider}/{model_id}")
        
        if provider not in self.provider_services:
            raise ValueError(f"Unsupported provider: {provider}")
        
        # Create a consistent format across providers
        formatted_text = ""
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            formatted_text += f"{role.capitalize()}: {content}\n"
            
        formatted_text += "Assistant: "
        
        logger.debug(f"Formatted prompt preview: {formatted_text[:100]}...")
        return formatted_text
    
    def _prepare_generation_params(
        self, 
        provider: str,
        messages: List[Dict[str, str]], 
        temperature: float, 
        max_tokens: int,
        system_prompt: Optional[str] = None
    ) -> Tuple[str, Dict[str, Any], List[Dict[str, str]]]:
        """Prepare parameters for text generation.
        
        Args:
            provider: The model provider
            messages: List of message dictionaries
            temperature: Temperature parameter for generation
            max_tokens: Maximum tokens to generate
            system_prompt: Optional system prompt
            
        Returns:
            Tuple of (formatted_prompt, params_dict, processed_messages)
        """
        # Add system prompt if provided
        processed_messages = messages
        if system_prompt:
            processed_messages = [{"role": "system", "content": system_prompt}] + messages
            
        # Prepare generation parameters
        params = {
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        # Format messages for the provider
        prompt = self._format_messages(provider, "", processed_messages)
        
        return prompt, params, processed_messages
    
    async def generate_response(
        self, 
        provider: str, 
        model_id: str, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7, 
        max_tokens: int = 1024,
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate a chat response using the specified model.
        
        Args:
            provider: The model provider (e.g., "huggingface", "ollama")
            model_id: The ID of the model to use
            messages: List of message dictionaries
            temperature: Temperature parameter for generation (default: 0.7)
            max_tokens: Maximum tokens to generate (default: 1024)
            system_prompt: Optional system prompt to prepend
            
        Returns:
            Generated response text
            
        Raises:
            ValueError: If an unsupported provider is specified
            Exception: For other errors during generation
        """
        try:
            # Log generation parameters
            logger.info(f"Generating response with {provider}/{model_id} (temp={temperature}, max_tokens={max_tokens})")
            
            # Prepare generation parameters
            prompt, params, processed_messages = self._prepare_generation_params(
                provider, messages, temperature, max_tokens, system_prompt
            )
            
            # Get the appropriate service for this provider
            if provider not in self.provider_services:
                raise ValueError(f"Unsupported provider: {provider}")
                
            service = self.provider_services[provider]
            
            # Generate the response
            response = await service.generate_text(model_id, prompt, params)
            logger.info(f"Generated response of length {len(response)} chars")
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}", exc_info=True)
            raise
    
    async def generate_stream(
        self, 
        provider: str, 
        model_id: str, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7, 
        max_tokens: int = 1024,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream a chat response using the specified model.
        
        Args:
            provider: The model provider (e.g., "huggingface", "ollama")
            model_id: The ID of the model to use
            messages: List of message dictionaries
            temperature: Temperature parameter for generation (default: 0.7)
            max_tokens: Maximum tokens to generate (default: 1024)
            system_prompt: Optional system prompt to prepend
            
        Yields:
            Tokens of the generated response as they become available
            
        Raises:
            ValueError: If an unsupported provider is specified
            Exception: For other errors during generation
        """
        try:
            # Log streaming parameters
            logger.info(f"Streaming response with {provider}/{model_id} (temp={temperature}, max_tokens={max_tokens})")
            
            # Prepare generation parameters
            prompt, params, processed_messages = self._prepare_generation_params(
                provider, messages, temperature, max_tokens, system_prompt
            )
            
            # Get the appropriate service for this provider
            if provider not in self.provider_services:
                raise ValueError(f"Unsupported provider: {provider}")
                
            service = self.provider_services[provider]
            
            # Stream the response
            token_count = 0
            async for token in service.generate_stream(model_id, prompt, params):
                token_count += 1
                # Log sample of tokens
                if token_count % 20 == 0:
                    logger.debug(f"Streaming token #{token_count}")
                yield token
                
            logger.info(f"Completed streaming response: {token_count} tokens sent")
                
        except Exception as e:
            logger.error(f"Error in streaming response: {str(e)}", exc_info=True)
            raise