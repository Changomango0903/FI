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
    
    # Default models list - extended with more options
    DEFAULT_MODELS: list = [
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
        env_file = ".env"

settings = Settings()