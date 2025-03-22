from typing import List, Dict, Union, Optional
import re
import logging

logger = logging.getLogger(__name__)

class TokenCounter:
    """
    Utility class for estimating token counts in text for different LLM providers.
    This is a simple implementation that approximates token counts.
    For production use, consider provider-specific tokenizers.
    """
    
    @staticmethod
    def estimate_tokens(text: str, provider: str = "default") -> int:
        """
        Estimate the number of tokens in the given text based on provider-specific rules.
        
        Args:
            text: The text to estimate tokens for
            provider: LLM provider (huggingface, ollama, or default)
            
        Returns:
            Estimated token count
        """
        if not text:
            return 0
            
        # Simple method: For English text, a good approximation is 4 characters per token
        # This varies by model but works as a conservative estimate
        if provider.lower() in ["huggingface", "hf"]:
            # HuggingFace models may have different tokenization depending on the model
            return len(text) // 3  # More conservative estimate (3 chars per token)
        elif provider.lower() == "ollama":
            # Ollama models (often based on Llama) typically have ~4 chars per token
            return len(text) // 4
        else:
            # Default to a conservative estimate
            return len(text) // 3
    
    @staticmethod
    def estimate_messages_tokens(messages: List[Dict[str, str]], provider: str = "default") -> int:
        """
        Estimate tokens for a list of chat messages.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            provider: LLM provider
            
        Returns:
            Total estimated token count
        """
        if not messages:
            return 0
            
        total_tokens = 0
        
        for message in messages:
            # Count role tokens (usually 1-2 tokens)
            role = message.get("role", "user")
            role_tokens = len(role) // 4 + 1
            
            # Count content tokens
            content = message.get("content", "")
            content_tokens = TokenCounter.estimate_tokens(content, provider)
            
            # Add overhead for message formatting (varies by provider)
            # Adding conservative estimate of 5 tokens per message for formatting
            message_tokens = role_tokens + content_tokens + 5
            total_tokens += message_tokens
            
        return total_tokens
    
    @staticmethod
    def get_provider_context_window(provider: str, model_id: str) -> int:
        """
        Get the typical context window size for the specified provider and model.
        
        Args:
            provider: LLM provider
            model_id: Model identifier
            
        Returns:
            Context window size in tokens
        """
        # Default context window sizes for common models
        # These are approximate and should be updated with actual values
        if provider.lower() == "huggingface":
            if "gpt2" in model_id.lower():
                return 1024
            elif "gpt-neo" in model_id.lower():
                return 2048
            elif "bart" in model_id.lower():
                return 1024
            else:
                return 2048  # Default for unknown HF models
                
        elif provider.lower() == "ollama":
            if "llama" in model_id.lower():
                if "70b" in model_id.lower():
                    return 4096
                elif "13b" in model_id.lower():
                    return 4096
                else:
                    return 4096  # Default for Llama models
            elif "mistral" in model_id.lower():
                return 8192
            else:
                return 4096  # Default for unknown Ollama models
                
        return 2048  # Default fallback
    
    @staticmethod
    def summarize_context(messages: List[Dict[str, str]], max_length: int = 500) -> str:
        """
        Create a helpful summary of the current context for logging.
        
        Args:
            messages: List of message dictionaries
            max_length: Maximum length of the summary
            
        Returns:
            A summary of the context suitable for logging
        """
        if not messages:
            return "Empty context"
            
        summary = []
        message_count = len(messages)
        
        summary.append(f"Context contains {message_count} messages:")
        
        # Add summaries of each message
        for i, message in enumerate(messages):
            role = message.get("role", "user")
            content = message.get("content", "")
            
            # Truncate content for the summary
            if len(content) > 50:
                content_preview = content[:47] + "..."
            else:
                content_preview = content
                
            # Replace newlines with space for cleaner logs
            content_preview = content_preview.replace("\n", " ")
            
            summary.append(f"  [{i+1}] {role.upper()}: {content_preview}")
            
        # Combine the summary
        full_summary = "\n".join(summary)
        
        # Truncate if too long
        if len(full_summary) > max_length:
            return full_summary[:max_length-3] + "..."
        
        return full_summary