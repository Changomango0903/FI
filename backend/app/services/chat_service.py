from app.services.hf_service import HuggingFaceService
from app.services.ollama_service import OllamaService
from app.utils.token_counter import TokenCounter
from app.utils.logger import get_logger
from app.utils.exceptions import ModelServiceError, ModelNotFoundError, ContextLimitExceededError
from typing import List, Dict, Any, AsyncGenerator, Optional, Tuple
import re
import asyncio

class ChatService:
    """Service for handling chat interactions with different model providers"""
    
    def __init__(self):
        """Initialize chat service with model service instances and utilities"""
        self.logger = get_logger(__name__)
        self.hf_service = HuggingFaceService()
        self.ollama_service = OllamaService()
        
        # Regex pattern for detecting thinking phase in responses
        self.thinking_pattern = re.compile(r'<think>(.*?)</think>', re.DOTALL)
        
        # Note: We don't call the async method directly from the constructor
        # Instead we'll initialize the context window info on first request
        self.context_window_initialized = False
        
        self.logger.info("Chat service initialized")
        
    async def _preload_context_window_sizes(self):
        """Preload context window sizes for models to improve accuracy"""
        if self.context_window_initialized:
            return
            
        try:
            # Get available models from Ollama
            ollama_models = await self.ollama_service.list_models()
            
            # For each model, get its context window size and register
            for model in ollama_models:
                model_id = model.id
                try:
                    # Get detailed model info
                    model_detail = await self.ollama_service.get_model_info(model_id)
                    
                    # Register the context window size
                    if model_detail and model_detail.context_length:
                        TokenCounter.register_context_window(
                            provider="ollama",
                            model_id=model_id,
                            context_length=model_detail.context_length
                        )
                        self.logger.debug(f"Registered context length for ollama/{model_id}: {model_detail.context_length}")
                except Exception as e:
                    self.logger.warning(f"Failed to register context window for {model_id}: {str(e)}")
                    continue
                    
            # Similar for HuggingFace models
            hf_models = await self.hf_service.list_models()
            
            for model in hf_models:
                model_id = model.id
                try:
                    model_detail = await self.hf_service.get_model_info(model_id)
                    if model_detail and model_detail.context_length:
                        TokenCounter.register_context_window(
                            provider="huggingface",
                            model_id=model_id,
                            context_length=model_detail.context_length
                        )
                        self.logger.debug(f"Registered context length for huggingface/{model_id}: {model_detail.context_length}")
                except Exception as e:
                    self.logger.warning(f"Failed to register context window for {model_id}: {str(e)}")
                    continue
            
            # Mark as initialized
            self.context_window_initialized = True
            self.logger.info("Context window sizes preloaded for models")
        except Exception as e:
            self.logger.error(f"Error preloading context window sizes: {str(e)}")
    
    def _format_messages(self, provider: str, model_id: str, messages: List[Dict[str, str]]) -> str:
        """
        Format messages according to the provider's expected format
        
        Args:
            provider: The model provider (e.g., "ollama", "huggingface")
            model_id: The model ID
            messages: List of message dictionaries with role and content
            
        Returns:
            Formatted prompt string ready for model input
            
        Raises:
            ValueError: If provider is not supported
        """
        self.logger.info(f"Formatting messages for {provider}/{model_id}")
        
        # Log the context window information
        asyncio.create_task(self._log_context_window_info(provider, model_id, messages))
        
        if provider == "huggingface":
            # Simple concatenation for HF models
            formatted_text = ""
            for message in messages:
                role = message.get("role", "user")
                content = message.get("content", "")
                formatted_text += f"{role.capitalize()}: {content}\n"
            formatted_text += "Assistant: "
            self.logger.info(f"Formatted HF prompt (first 100 chars): {formatted_text[:100]}...")
            return formatted_text
        
        elif provider == "ollama":
            # Ollama format
            formatted_text = ""
            for message in messages:
                role = message.get("role", "user")
                content = message.get("content", "")
                formatted_text += f"{role.capitalize()}: {content}\n"
            formatted_text += "Assistant: "
            self.logger.info(f"Formatted Ollama prompt (first 100 chars): {formatted_text[:100]}...")
            return formatted_text
        
        else:
            error_msg = f"Unsupported provider: {provider}"
            self.logger.error(error_msg)
            raise ValueError(error_msg)
    
    async def _update_context_window_info(self, provider: str, model_id: str):
        """
        Update context window size information for a model
        
        Args:
            provider: The model provider
            model_id: The model ID
        """
        # Make sure we've initialized context window sizes
        if not self.context_window_initialized:
            await self._preload_context_window_sizes()
            
        try:
            if provider == "ollama":
                model_detail = await self.ollama_service.get_model_info(model_id)
                if model_detail and model_detail.context_length:
                    TokenCounter.register_context_window(
                        provider=provider,
                        model_id=model_id,
                        context_length=model_detail.context_length
                    )
                    return model_detail.context_length
            elif provider == "huggingface":
                model_detail = await self.hf_service.get_model_info(model_id)
                if model_detail and model_detail.context_length:
                    TokenCounter.register_context_window(
                        provider=provider,
                        model_id=model_id,
                        context_length=model_detail.context_length
                    )
                    return model_detail.context_length
        except Exception as e:
            self.logger.warning(f"Failed to update context window for {provider}/{model_id}: {str(e)}")
        
        return None
    
    async def _log_context_window_info(self, provider: str, model_id: str, messages: List[Dict[str, str]]):
        """
        Log information about the context window usage
        
        Args:
            provider: The model provider
            model_id: The model ID
            messages: List of message dictionaries
        """
        try:
            # Make sure we have the latest context window info
            await self._update_context_window_info(provider, model_id)
            
            # Estimate token count
            token_count = TokenCounter.estimate_messages_tokens(messages, provider, model_id)
            
            # Get context window size for the model
            context_window = TokenCounter.get_provider_context_window(provider, model_id)
            
            # Calculate percentage of context window used
            usage_percentage = (token_count / context_window) * 100 if context_window > 0 else 0
            
            # Get context summary for logging
            context_summary = TokenCounter.summarize_context(messages)
            
            # Log context window information
            self.logger.info(f"CONTEXT WINDOW INFO - Provider: {provider}, Model: {model_id}")
            self.logger.info(f"Estimated token count: {token_count} / {context_window} tokens ({usage_percentage:.1f}% used)")
            self.logger.info(f"Context summary:\n{context_summary}")
            
            # Check if exceeding context window limit and raise appropriate exception
            if token_count > context_window:
                raise ContextLimitExceededError(
                    token_count=token_count,
                    context_window=context_window,
                    model_id=f"{provider}/{model_id}"
                )
            
            # Log warning if approaching context window limit
            if usage_percentage > 80:
                self.logger.warning(f"Context window usage is high ({usage_percentage:.1f}%). Consider trimming older messages.")
            
        except ContextLimitExceededError:
            # Re-raise this specific exception
            raise
        except Exception as e:
            self.logger.error(f"Error logging context window info: {str(e)}")
    
    def _extract_thinking_content(self, text: str) -> Tuple[str, Optional[str]]:
        """
        Extract thinking content from a response string.
        
        Args:
            text: The response text that may contain thinking sections
            
        Returns:
            Tuple of (response_without_thinking, thinking_content)
        """
        thinking_match = self.thinking_pattern.search(text)
        
        if thinking_match:
            thinking_content = thinking_match.group(1).strip()
            response_content = self.thinking_pattern.sub('', text).strip()
            self.logger.debug(f"Extracted thinking content: {thinking_content[:100]}...")
            return response_content, thinking_content
        else:
            return text, None
    
    def _is_reasoning_model(self, model_id: str) -> bool:
        """
        Check if the model is a reasoning model that uses thinking phase
        
        Args:
            model_id: The model ID to check
            
        Returns:
            True if the model is a reasoning model, False otherwise
        """
        from app.config import settings
        
        # Get reasoning models from settings
        reasoning_models = settings.REASONING_MODELS
        
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
        """
        Generate a chat response using the specified model
        
        Args:
            provider: The model provider (e.g., "ollama", "huggingface")
            model_id: The model ID
            messages: List of message dictionaries with role and content
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            system_prompt: Optional system prompt to prepend to messages
            
        Returns:
            Dictionary with response text and optional thinking content
            
        Raises:
            ModelServiceError: If there's an error in the model service
            ModelNotFoundError: If the model is not found
            ContextLimitExceededError: If the context limit is exceeded
            ValueError: If the provider is not supported
        """
        try:
            # Ensure we have accurate context window info
            await self._update_context_window_info(provider, model_id)
            
            # Log the temperature being used
            self.logger.info(f"USING TEMPERATURE: {temperature} for {provider}/{model_id}")
            
            # Add system prompt if provided
            if system_prompt:
                messages = [{"role": "system", "content": system_prompt}] + messages
                
            prompt = self._format_messages(provider, model_id, messages)
            
            if provider == "huggingface":
                response_text = await self.hf_service.generate_text(
                    model_id, 
                    prompt, 
                    temperature=temperature, 
                    max_tokens=max_tokens
                )
            elif provider == "ollama":
                response_text = await self.ollama_service.generate_text(
                    model_id, 
                    prompt, 
                    temperature=temperature, 
                    max_tokens=max_tokens
                )
            else:
                error_msg = f"Unsupported provider: {provider}"
                self.logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Check if the model is a reasoning model and extract thinking content
            response_text, thinking_content = self._extract_thinking_content(response_text)
            
            # Return a dictionary with both the response and thinking content
            return {
                "response": response_text,
                "thinking": thinking_content
            }
        except (ModelServiceError, ModelNotFoundError, ContextLimitExceededError):
            # Re-raise known exceptions
            raise
        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            self.logger.error(error_msg)
            raise ModelServiceError(
                message=error_msg,
                details={"provider": provider, "model_id": model_id}
            )
    
    async def generate_stream(
        self, 
        provider: str, 
        model_id: str, 
        messages: List[Dict[str, str]], 
        temperature: float = 0.7, 
        max_tokens: int = 1024,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream a chat response using the specified model
        
        Args:
            provider: The model provider (e.g., "ollama", "huggingface")
            model_id: The model ID
            messages: List of message dictionaries with role and content
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            system_prompt: Optional system prompt to prepend to messages
            
        Yields:
            Dictionaries with token text and type (response or thinking)
            
        Raises:
            ModelServiceError: If there's an error in the model service
            ModelNotFoundError: If the model is not found
            ContextLimitExceededError: If the context limit is exceeded
            ValueError: If the provider is not supported
        """
        try:
            # Ensure we have accurate context window info
            await self._update_context_window_info(provider, model_id)
            
            # Log the temperature being used for streaming
            self.logger.info(f"USING TEMPERATURE FOR STREAMING: {temperature} for {provider}/{model_id}")
            
            # Add system prompt if provided
            if system_prompt:
                messages = [{"role": "system", "content": system_prompt}] + messages
                
            prompt = self._format_messages(provider, model_id, messages)
            
            # Variables to track thinking mode and content
            in_thinking_mode = False
            buffered_thinking = ""
            current_thinking_content = ""
            response_content = ""
            is_reasoning_model = self._is_reasoning_model(model_id)
            
            if provider == "huggingface":
                generator = self.hf_service.generate_stream(
                    model_id, 
                    prompt, 
                    temperature=temperature, 
                    max_tokens=max_tokens
                )
            elif provider == "ollama":
                generator = self.ollama_service.generate_stream(
                    model_id, 
                    prompt, 
                    temperature=temperature, 
                    max_tokens=max_tokens
                )
            else:
                error_msg = f"Unsupported provider: {provider}"
                self.logger.error(error_msg)
                raise ValueError(error_msg)
            
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
                self.logger.debug(f"Completed streaming with thinking content: {current_thinking_content[:100]}...")
            
        except (ModelServiceError, ModelNotFoundError, ContextLimitExceededError):
            # Re-raise known exceptions
            raise
        except Exception as e:
            error_msg = f"Error in streaming response: {str(e)}"
            self.logger.error(error_msg)
            raise ModelServiceError(
                message=error_msg,
                details={"provider": provider, "model_id": model_id}
            )