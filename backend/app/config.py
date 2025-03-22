import os
from typing import List, Dict, Any, Optional
from pydantic import Field
from pydantic_settings import BaseSettings
import logging
from functools import lru_cache


class Settings(BaseSettings):
    """Main settings class for the application"""
    
    # API settings
    API_PREFIX: str = Field(default="/api")
    API_DEBUG: bool = Field(default=True)
    API_HOST: str = Field(default="0.0.0.0")
    API_PORT: int = Field(default=8000)
    
    # Logging settings
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    LOG_DATE_FORMAT: str = Field(default="%Y-%m-%d %H:%M:%S")
    
    # Provider settings
    HF_API_TOKEN: str = Field(default="")
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434")
    
    # Model settings
    DEFAULT_MODELS: List[Dict[str, Any]] = Field(default=[
        {"id": "ollama/llama2", "name": "Llama 2", "provider": "ollama", "description": "Meta's Llama 2 model"},
        {"id": "ollama/mistral", "name": "Mistral", "provider": "ollama", "description": "Mistral 7B model"},
        {"id": "gpt2", "name": "GPT-2", "provider": "huggingface", "description": "OpenAI's GPT-2 model"}
    ])
    REASONING_MODELS: List[str] = Field(default=[
        "deepseek-r1", "qwen", "qwen2", "qwen1.5", "mixtral", 
        "mistral-small", "yi", "claude"
    ])
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Returns cached settings instance to avoid loading .env file multiple times"""
    return Settings()


# Create settings instance
settings = get_settings()


def configure_logging():
    """Configure logging based on the settings"""
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL),
        format=settings.LOG_FORMAT,
        datefmt=settings.LOG_DATE_FORMAT
    )
    # Set lower log levels for some noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)