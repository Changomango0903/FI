from typing import List, Dict, Any, Optional, Union
import re
import tiktoken
from app.utils.logger import get_logger
from app.utils.exceptions import ModelServiceError

logger = get_logger(__name__)

class TokenCounter:
    """
    Utility for counting tokens in text and messages
    
    This class provides methods to estimate token usage for different models
    and context window management.
    """
    
    # Context window sizes for different models (conservative estimates)
    # These are fallback values if we can't get actual values from model services
    CONTEXT_WINDOWS = {
        "default": 4096,
        "gpt-3.5-turbo": 4096,
        "gpt-4": 8192,
        "gpt-4-32k": 32768,
        "llama2": 4096,
        "llama3": 8192,
        "mistral": 8192,
        "mixtral": 32768,
        "claude": 100000,
        "gpt2": 1024,
        "huggingface/default": 2048,
        "ollama/default": 4096
    }
    
    # Dynamic cache for context windows fetched from model services
    _dynamic_context_windows = {}
    
    # Token encoding models
    ENCODINGS = {
        "gpt-3.5-turbo": "cl100k_base",
        "gpt-4": "cl100k_base",
        "llama2": "cl100k_base",
        "llama3": "cl100k_base",
        "mistral": "cl100k_base",
        "mixtral": "cl100k_base",
        "claude": "cl100k_base",
        "gpt2": "gpt2",
        "default": "cl100k_base"
    }
    
    @classmethod
    def get_encoding(cls, model: str) -> tiktoken.Encoding:
        """
        Get the appropriate tokenizer encoding for a model
        
        Args:
            model: The model identifier
            
        Returns:
            A tiktoken encoding instance
        """
        # Extract base model name from versioned models
        base_model = model.split(':')[0].lower() if ':' in model else model.lower()
        
        # Check for common model families
        if 'llama2' in base_model:
            encoding_name = cls.ENCODINGS["llama2"]
        elif 'llama3' in base_model:
            encoding_name = cls.ENCODINGS["llama3"]
        elif 'mistral' in base_model:
            encoding_name = cls.ENCODINGS["mistral"]
        elif 'mixtral' in base_model:
            encoding_name = cls.ENCODINGS["mixtral"]
        elif 'claude' in base_model:
            encoding_name = cls.ENCODINGS["claude"]
        elif 'gpt2' in base_model:
            encoding_name = cls.ENCODINGS["gpt2"]
        else:
            encoding_name = cls.ENCODINGS.get(model, cls.ENCODINGS["default"])
        
        try:
            return tiktoken.get_encoding(encoding_name)
        except Exception as e:
            logger.warning(f"Error getting encoding for {model}, using default: {str(e)}")
            return tiktoken.get_encoding(cls.ENCODINGS["default"])
    
    @classmethod
    def count_tokens(cls, text: str, model: str = "default") -> int:
        """
        Count the number of tokens in a text string
        
        Args:
            text: The text to count tokens for
            model: The model to use for token counting
            
        Returns:
            The number of tokens in the text
        """
        if not text:
            return 0
            
        try:
            encoding = cls.get_encoding(model)
            tokens = encoding.encode(text)
            return len(tokens)
        except Exception as e:
            logger.warning(f"Error counting tokens: {str(e)}")
            # Fallback to approximation
            return cls._approximate_token_count(text)
    
    @classmethod
    def _approximate_token_count(cls, text: str) -> int:
        """
        Approximate token count for when the encoder fails
        
        Args:
            text: The text to count tokens for
            
        Returns:
            An approximate token count
        """
        # Rough approximation: 4 chars per token for English text
        return max(1, len(text) // 4)
    
    @classmethod
    def register_context_window(cls, provider: str, model_id: str, context_length: int) -> None:
        """
        Register a context window size for a model dynamically
        
        Args:
            provider: The provider (e.g., 'ollama', 'huggingface')
            model_id: The model ID
            context_length: The context window size in tokens
        """
        # Store with both full ID and model ID only
        full_id = f"{provider}/{model_id}"
        cls._dynamic_context_windows[full_id] = context_length
        cls._dynamic_context_windows[model_id] = context_length
        
        # Also store by model family (e.g., llama3 for llama3:latest)
        if ':' in model_id:
            model_family = model_id.split(':')[0]
            existing_length = cls._dynamic_context_windows.get(model_family)
            # Only update if we don't have a value or the new one is smaller (conservative)
            if not existing_length or context_length < existing_length:
                cls._dynamic_context_windows[model_family] = context_length
                cls._dynamic_context_windows[f"{provider}/{model_family}"] = context_length
        
        logger.debug(f"Registered context window for {full_id}: {context_length} tokens")
    
    @classmethod
    def get_provider_context_window(cls, provider: str, model_id: str) -> int:
        """
        Get the context window size for a model
        
        Args:
            provider: The provider (e.g., 'ollama', 'huggingface')
            model_id: The model ID
            
        Returns:
            The context window size in tokens
        """
        # Check dynamic context windows first (most accurate)
        full_id = f"{provider}/{model_id}"
        dynamic_size = cls._dynamic_context_windows.get(full_id)
        if dynamic_size:
            return dynamic_size
        
        # Try just the model ID
        dynamic_size = cls._dynamic_context_windows.get(model_id)
        if dynamic_size:
            return dynamic_size
        
        # Try model family (e.g., llama3 for llama3:latest)
        if ':' in model_id:
            model_family = model_id.split(':')[0]
            dynamic_size = cls._dynamic_context_windows.get(model_family)
            if dynamic_size:
                return dynamic_size
            
            dynamic_size = cls._dynamic_context_windows.get(f"{provider}/{model_family}")
            if dynamic_size:
                return dynamic_size
        
        # Check for provider/model specific context window in static mapping
        if full_id in cls.CONTEXT_WINDOWS:
            return cls.CONTEXT_WINDOWS[full_id]
        elif model_id in cls.CONTEXT_WINDOWS:
            return cls.CONTEXT_WINDOWS[model_id]
        
        # Check for model family in static mapping
        if ':' in model_id:
            model_family = model_id.split(':')[0]
            if model_family in cls.CONTEXT_WINDOWS:
                return cls.CONTEXT_WINDOWS[model_family]
        
        # Fall back to provider default
        provider_default = f"{provider}/default"
        if provider_default in cls.CONTEXT_WINDOWS:
            return cls.CONTEXT_WINDOWS[provider_default]
        
        # Ultimate fallback
        logger.warning(f"No context window size found for {full_id}, using default (4096)")
        return cls.CONTEXT_WINDOWS["default"]
    
    @classmethod
    def estimate_messages_tokens(
        cls, 
        messages: List[Dict[str, str]], 
        provider: str = "default", 
        model_id: str = "default"
    ) -> int:
        """
        Estimate the token count for a list of messages
        
        Args:
            messages: List of message dictionaries
            provider: The provider
            model_id: The model ID
            
        Returns:
            Estimated token count
        """
        if not messages:
            return 0
        
        # Find the appropriate model for token counting
        model = model_id
        if provider == "ollama":
            model = model_id
        elif provider == "huggingface":
            model = "gpt2"  # Use GPT-2 tokenizer for HF models as approximation
        
        # Count tokens in messages
        total_tokens = 0
        for message in messages:
            content = message.get("content", "")
            role = message.get("role", "user")
            
            # Count message content tokens
            content_tokens = cls.count_tokens(content, model)
            
            # Add role overhead (approximation)
            role_overhead = 4  # ~4 tokens for role specification
            
            # Add to total
            total_tokens += content_tokens + role_overhead
        
        # Add message formatting overhead (approximation)
        format_overhead = len(messages) * 3
        
        # Add system message overhead if not present
        if not any(msg.get("role") == "system" for msg in messages):
            format_overhead += 10
        
        return total_tokens + format_overhead
    
    @classmethod
    def summarize_context(cls, messages: List[Dict[str, str]]) -> str:
        """
        Create a summary of the context window usage by role
        
        Args:
            messages: List of message dictionaries
            
        Returns:
            A formatted string with context usage summary
        """
        if not messages:
            return "No messages in context"
        
        # Count messages per role for a more concise summary
        message_count = len(messages)
        
        # Format a brief message-by-message summary
        summary = f"Context contains {message_count} messages:\n"
        for i, message in enumerate(messages, 1):
            role = message.get("role", "user").upper()
            content = message.get("content", "")
            content_preview = content[:50] + "..." if len(content) > 50 else content
            summary += f"  [{i}] {role}: {content_preview}\n"
            
            # Limit the summary to avoid very long logs
            if i >= 10 and len(messages) > 12:
                remaining = len(messages) - i
                summary += f"  ... and {remaining} more messages\n"
                break
        
        return summary