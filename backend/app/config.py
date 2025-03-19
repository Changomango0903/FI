# app/config.py

import os
from typing import List, Dict, Any
from pydantic_settings import BaseSettings
import logging

# Configure logger for this module
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """Application configuration settings.
    
    This class manages all the configuration parameters for the application,
    using environment variables with sensible defaults.
    """
    # API settings
    API_PREFIX: str = "/api"
    DEBUG: bool = True
    
    # HuggingFace settings
    HF_API_TOKEN: str = os.getenv("HF_API_TOKEN", "")
    
    # Ollama settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # CORS settings
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    ALLOWED_ORIGINS: List[str] = [FRONTEND_URL]
    
    # Default models configuration
    DEFAULT_MODELS: List[Dict[str, Any]] = [
        # Ollama models
        {"id": "llama3:latest", "name": "Llama 3", "provider": "ollama", "description": "Meta's Llama 3 model"},
        {"id": "llama3.1:latest", "name": "Llama 3.1", "provider": "ollama", "description": "Meta's Llama 3.1 model"},
        {"id": "mistral:latest", "name": "Mistral", "provider": "ollama", "description": "Mistral 7B model"},
        {"id": "mistral-small:latest", "name": "Mistral Small", "provider": "ollama", "description": "Mistral's smaller model"},
        {"id": "mistral-medium:latest", "name": "Mistral Medium", "provider": "ollama", "description": "Mistral's medium-sized model"},
        {"id": "mistral-large:latest", "name": "Mistral Large", "provider": "ollama", "description": "Mistral's large model"},
        {"id": "deepseek:latest", "name": "DeepSeek", "provider": "ollama", "description": "DeepSeek Coder model"},
        {"id": "deepseek-coder:latest", "name": "DeepSeek Coder", "provider": "ollama", "description": "DeepSeek specialized coding model"},
        {"id": "phi3:latest", "name": "Phi-3", "provider": "ollama", "description": "Microsoft's Phi-3 model"},
        {"id": "gemma:latest", "name": "Gemma", "provider": "ollama", "description": "Google's Gemma model"},
        {"id": "gemma2:latest", "name": "Gemma 2", "provider": "ollama", "description": "Google's Gemma 2 model"},
        {"id": "codellama:latest", "name": "Code Llama", "provider": "ollama", "description": "Meta's Code Llama model"},
        
        # HuggingFace models
        {"id": "gpt2", "name": "GPT-2", "provider": "huggingface", "description": "OpenAI's GPT-2 model"}
    ]
    
    class Config:
        """Configure settings metadata."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    def validate_configuration(self) -> None:
        """Validate the current configuration and log warnings for potential issues."""
        if not self.HF_API_TOKEN:
            logger.warning("HF_API_TOKEN not set - HuggingFace API calls may be rate limited")
        
        if not os.environ.get("OLLAMA_BASE_URL"):
            logger.warning("OLLAMA_BASE_URL not set in environment. Using default: http://localhost:11434")

# Create a global settings instance
settings = Settings()

# Validate the configuration
settings.validate_configuration()