from app.services.hf_service import HuggingFaceService
from app.services.ollama_service import OllamaService
from typing import List, Dict, Any, AsyncGenerator, Optional
import logging
import json

logger = logging.getLogger(__name__)

class ChatService:
    """Service for handling chat interactions with different model providers"""
    
    def __init__(self):
        self.hf_service = HuggingFaceService()
        self.ollama_service = OllamaService()
    
    def _format_messages(self, provider: str, model_id: str, messages: List[Dict[str, str]]) -> str:
        """Format messages according to the provider's expected format"""
        logger.info(f"Formatting messages for {provider}/{model_id}")
        
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
    
    async def get_chat_history(self, chat_id: str) -> List[Dict[str, str]]:
        """
        Retrieve chat history for a specific chat ID
        This is a placeholder for future database integration
        """
        # In a real implementation, this would fetch from a database
        # For now, we'll return an empty list as we're using client-side storage
        return []
    
    async def save_chat_message(self, chat_id: str, message: Dict[str, str]) -> bool:
        """
        Save a chat message to the database
        This is a placeholder for future database integration
        """
        # In a real implementation, this would save to a database
        # For now, we'll just return True as we're using client-side storage
        return True
    
    async def create_embeddings(self, text: str, provider: str = "huggingface", model_id: str = None) -> List[float]:
        """
        Create embeddings for text - useful for future RAG capabilities
        This is a placeholder for future functionality
        """
        # This is a stub for future RAG implementation
        if provider == "huggingface":
            # In real implementation, this would use a proper embedding model
            return await self.hf_service.create_embeddings(text, model_id)
        else:
            raise ValueError(f"Embedding generation not supported for provider: {provider}")
    
    async def count_tokens(self, text: str, provider: str, model_id: str) -> int:
        """
        Count tokens in text for a specific model
        """
        try:
            if provider == "huggingface":
                return await self.hf_service.count_tokens(text, model_id)
            elif provider == "ollama":
                # Most Ollama models use tiktoken-compatible tokenizers
                # For simplicity, estimate token count as words/0.75
                return int(len(text.split()) / 0.75)
            else:
                raise ValueError(f"Token counting not supported for provider: {provider}")
        except Exception as e:
            logger.error(f"Error counting tokens: {str(e)}")
            # Fallback to a rough estimation
            return int(len(text.split()) / 0.75)
                
    async def get_model_parameters(self, provider: str, model_id: str) -> Dict[str, Any]:
        """
        Get available parameters for a specific model
        """
        try:
            if provider == "huggingface":
                model_info = await self.hf_service.get_model_info(model_id)
                return model_info.parameters or {}
            elif provider == "ollama":
                model_info = await self.ollama_service.get_model_info(model_id)
                return model_info.parameters or {}
            else:
                raise ValueError(f"Unsupported provider: {provider}")
        except Exception as e:
            logger.error(f"Error getting model parameters: {str(e)}")
            return {}
    
    def convert_to_markdown(self, text: str) -> str:
        """
        Convert certain text patterns to markdown for better display
        """
        # This is a simple implementation - could be enhanced
        import re
        
        # Convert code blocks
        text = re.sub(r'```(\w+)?\n(.*?)\n```', r'```\1\n\2\n```', text, flags=re.DOTALL)
        
        # Convert inline code
        text = re.sub(r'`([^`]+)`', r'`\1`', text)
        
        # Convert bullet points
        text = re.sub(r'^- ', r'- ', text, flags=re.MULTILINE)
        
        return text