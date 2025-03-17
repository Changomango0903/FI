import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API settings
    API_PREFIX: str = "/api"
    DEBUG: bool = True
    
    # HuggingFace settings
    HF_API_TOKEN: str = os.getenv("HF_API_TOKEN", "")
    
    # Ollama settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Default models list - can be extended
    DEFAULT_MODELS: list = [
        {"id": "ollama/llama2", "name": "Llama 2", "provider": "ollama", "description": "Meta's Llama 2 model"},
        {"id": "ollama/mistral", "name": "Mistral", "provider": "ollama", "description": "Mistral 7B model"},
        {"id": "gpt2", "name": "GPT-2", "provider": "huggingface", "description": "OpenAI's GPT-2 model"}
    ]
    
    class Config:
        env_file = ".env"

settings = Settings()