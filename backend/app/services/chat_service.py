from app.services.hf_service import HuggingFaceService
from app.services.ollama_service import OllamaService
from app.utils.token_counter import TokenCounter
from typing import List, Dict, Any, AsyncGenerator, Optional, Tuple
import logging
import json
import re

logger = logging.getLogger(__name__)

class ChatService:
    """Service for handling chat interactions with different model providers"""
    
    def __init__(self):
        self.hf_service = HuggingFaceService()
        self.ollama_service = OllamaService()
        self.token_counter = TokenCounter()
        
        # Regex pattern for detecting thinking phase in responses
        self.thinking_pattern = re.compile(r'<think>(.*?)</think>', re.DOTALL)
    
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
    
    def _extract_thinking_content(self, text: str) -> Tuple[str, Optional[str]]:
        """
        Extract thinking content from a response string.
        Returns a tuple of (response_without_thinking, thinking_content)
        """
        thinking_match = self.thinking_pattern.search(text)
        
        if thinking_match:
            thinking_content = thinking_match.group(1).strip()
            response_content = self.thinking_pattern.sub('', text).strip()
            logger.info(f"Extracted thinking content: {thinking_content[:100]}...")
            return response_content, thinking_content
        else:
            return text, None
    
    def _is_reasoning_model(self, model_id: str) -> bool:
        """Check if the model is a reasoning model that uses thinking phase"""
        reasoning_models = ["deepseek-r1", "qwen", "qwen2", "qwen1.5", "mixtral", "mistral-small", "yi", "claude"]
        
        # Check if any reasoning model keyword is in the model id (case insensitive)
        return any(rm.lower() in model_id.lower() for rm in reasoning_models)
    
    async def generate_response(
        self, 
        provider: str, 
        model_id: str, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7, 
        max_tokens: int = 1024,
        system_prompt: Optional[str] = None
    ) -> Dict[str, str]:
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
                response_text = await self.hf_service.generate_text(model_id, prompt, params)
            elif provider == "ollama":
                response_text = await self.ollama_service.generate_text(model_id, prompt, params)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
            
            # Check if the model is a reasoning model and extract thinking content
            response_text, thinking_content = self._extract_thinking_content(response_text)
            
            # Return a dictionary with both the response and thinking content
            return {
                "response": response_text,
                "thinking": thinking_content
            }
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
    ) -> AsyncGenerator[Dict[str, Any], None]:
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
            
            # Variables to track thinking mode and content
            in_thinking_mode = False
            buffered_thinking = ""
            current_thinking_content = ""
            response_content = ""
            is_reasoning_model = self._is_reasoning_model(model_id)
            
            if provider == "huggingface":
                generator = self.hf_service.generate_stream(model_id, prompt, params)
            elif provider == "ollama":
                generator = self.ollama_service.generate_stream(model_id, prompt, params)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
            
            async for token in generator:
                # Process token for thinking tags and content
                if is_reasoning_model:
                    # Check for start of thinking phase
                    if '<think>' in token:
                        in_thinking_mode = True
                        buffered_thinking = ""
                        # Split the token so we can handle content before the thinking tag
                        parts = token.split('<think>', 1)
                        if parts[0]:  # There's content before the <think> tag
                            response_content += parts[0]
                            yield {"token": parts[0], "type": "response"}
                        
                        # If there's content after the <think> tag, add it to thinking buffer
                        if len(parts) > 1 and parts[1]:
                            buffered_thinking += parts[1]
                        continue
                    
                    # Check for end of thinking phase
                    elif '</think>' in token:
                        in_thinking_mode = False
                        parts = token.split('</think>', 1)
                        
                        # Add any content before the </think> tag to the thinking buffer
                        if parts[0]:
                            buffered_thinking += parts[0]
                        
                        # Add the buffered thinking to the complete thinking content
                        if buffered_thinking:
                            current_thinking_content += buffered_thinking
                            yield {"token": buffered_thinking, "type": "thinking"}
                            buffered_thinking = ""
                        
                        # If there's content after the </think> tag, add it to response
                        if len(parts) > 1 and parts[1]:
                            response_content += parts[1]
                            yield {"token": parts[1], "type": "response"}
                        continue
                    
                    # Handle content while we're in thinking mode
                    if in_thinking_mode:
                        buffered_thinking += token
                        
                        # Only yield complete thinking content when buffer gets large enough
                        if len(buffered_thinking) > 10:
                            current_thinking_content += buffered_thinking
                            yield {"token": buffered_thinking, "type": "thinking"}
                            buffered_thinking = ""
                        continue
                
                # Normal response token
                response_content += token
                yield {"token": token, "type": "response"}
            
            # Yield any remaining buffered thinking content
            if buffered_thinking:
                current_thinking_content += buffered_thinking
                yield {"token": buffered_thinking, "type": "thinking"}
            
            # Log the thinking content for debugging
            if current_thinking_content:
                logger.info(f"Completed streaming with thinking content: {current_thinking_content[:100]}...")
            
        except Exception as e:
            logger.error(f"Error in streaming response: {str(e)}")
            raise