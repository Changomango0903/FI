from app.services.hf_service import HuggingFaceService
from app.services.ollama_service import OllamaService
from app.utils.token_counter import TokenCounter
from typing import List, Dict, Any, AsyncGenerator, Optional
import logging
import json

logger = logging.getLogger(__name__)

class ChatService:
    """Service for handling chat interactions with different model providers"""
    
    def __init__(self):
        self.hf_service = HuggingFaceService()
        self.ollama_service = OllamaService()
        self.token_counter = TokenCounter()
    
    def _format_messages(self, provider: str, model_id: str, messages: List[Dict[str, str]]) -> str:
        """Format messages according to the provider's expected format"""
        logger.info(f"Formatting messages for {provider}/{model_id}")
        
        # Log the context window information
        self._log_context_window_info(provider, model_id, messages)
        
        if provider == "huggingface":
            # Simple concatenation for HF models
            formatted_text = ""
            for message in messages:
                role = message.get("role", "user")
                content = message.get("content", "")
                formatted_text += f"{role.capitalize()}: {content}\n"
            formatted_text += "Assistant: "
            logger.info(f"Formatted HF prompt (first 100 chars): {formatted_text[:100]}...")
            return formatted_text
        
        elif provider == "ollama":
            # Ollama format
            formatted_text = ""
            for message in messages:
                role = message.get("role", "user")
                content = message.get("content", "")
                formatted_text += f"{role.capitalize()}: {content}\n"
            formatted_text += "Assistant: "
            logger.info(f"Formatted Ollama prompt (first 100 chars): {formatted_text[:100]}...")
            return formatted_text
        
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def _log_context_window_info(self, provider: str, model_id: str, messages: List[Dict[str, str]]):
        """Log information about the context window usage"""
        try:
            # Estimate token count
            token_count = TokenCounter.estimate_messages_tokens(messages, provider)
            
            # Get context window size for the model
            context_window = TokenCounter.get_provider_context_window(provider, model_id)
            
            # Calculate percentage of context window used
            usage_percentage = (token_count / context_window) * 100
            
            # Get context summary for logging
            context_summary = TokenCounter.summarize_context(messages)
            
            # Log context window information
            logger.info(f"CONTEXT WINDOW INFO - Provider: {provider}, Model: {model_id}")
            logger.info(f"Estimated token count: {token_count} / {context_window} tokens ({usage_percentage:.1f}% used)")
            logger.info(f"Context summary:\n{context_summary}")
            
            # Log warning if approaching context window limit
            if usage_percentage > 80:
                logger.warning(f"Context window usage is high ({usage_percentage:.1f}%). Consider trimming older messages.")
            
        except Exception as e:
            logger.error(f"Error logging context window info: {str(e)}")
    
    async def generate_response(
        self, 
        provider: str, 
        model_id: str, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7, 
        max_tokens: int = 1024,
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate a chat response using the specified model"""
        try:
            # Log the temperature being used
            logger.info(f"USING TEMPERATURE: {temperature} for {provider}/{model_id}")
            
            # Add system prompt if provided
            if system_prompt:
                messages = [{"role": "system", "content": system_prompt}] + messages
                
            prompt = self._format_messages(provider, model_id, messages)
            params = {
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            
            if provider == "huggingface":
                return await self.hf_service.generate_text(model_id, prompt, params)
            elif provider == "ollama":
                return await self.ollama_service.generate_text(model_id, prompt, params)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
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
        """Stream a chat response using the specified model"""
        try:
            # Log the temperature being used for streaming
            logger.info(f"USING TEMPERATURE FOR STREAMING: {temperature} for {provider}/{model_id}")
            
            # Add system prompt if provided
            if system_prompt:
                messages = [{"role": "system", "content": system_prompt}] + messages
                
            prompt = self._format_messages(provider, model_id, messages)
            params = {
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            
            if provider == "huggingface":
                async for token in self.hf_service.generate_stream(model_id, prompt, params):
                    yield token
            elif provider == "ollama":
                async for token in self.ollama_service.generate_stream(model_id, prompt, params):
                    yield token
            else:
                raise ValueError(f"Unsupported provider: {provider}")
        except Exception as e:
            logger.error(f"Error in streaming response: {str(e)}")
            raise