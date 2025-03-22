from fastapi import APIRouter, Depends
from app.services.hf_service import HuggingFaceService
from app.services.ollama_service import OllamaService
from app.models.schema import ModelList, ModelDetail
from app.utils.logger import get_logger
from app.utils.exceptions import ModelServiceError, ModelNotFoundError, ValidationError
from app.config import settings
import asyncio

# Initialize router
router = APIRouter()
logger = get_logger(__name__)

# Service dependencies
def get_hf_service() -> HuggingFaceService:
    """Dependency for HuggingFace service"""
    return HuggingFaceService()

def get_ollama_service() -> OllamaService:
    """Dependency for Ollama service"""
    return OllamaService()

@router.get("/models", response_model=ModelList)
async def get_available_models(
    hf_service: HuggingFaceService = Depends(get_hf_service),
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """
    Get all available models from both HuggingFace and Ollama
    
    Returns:
        ModelList with models from all available providers
        
    Raises:
        ModelServiceError: If fetching models fails
    """
    try:
        logger.info("Fetching available models from all providers")
        
        # Run both requests concurrently for better performance
        hf_task = asyncio.create_task(hf_service.list_models())
        ollama_task = asyncio.create_task(ollama_service.list_models())
        
        # Wait for both to complete
        hf_models, ollama_models = await asyncio.gather(hf_task, ollama_task)
        
        # Combine the results
        all_models = hf_models + ollama_models
        
        logger.info(f"Found {len(all_models)} models from all providers")
        return ModelList(models=all_models)
        
    except Exception as e:
        logger.error(f"Failed to fetch models: {str(e)}")
        raise ModelServiceError(
            message=f"Failed to fetch available models: {str(e)}"
        )

@router.get("/models/{provider}/{model_id}", response_model=ModelDetail)
async def get_model_details(
    provider: str, 
    model_id: str,
    hf_service: HuggingFaceService = Depends(get_hf_service),
    ollama_service: OllamaService = Depends(get_ollama_service)
):
    """
    Get detailed information about a specific model
    
    Args:
        provider: The model provider (e.g., "ollama", "huggingface")
        model_id: The model ID to fetch details for
        
    Returns:
        ModelDetail with detailed model information
        
    Raises:
        ValidationError: If the provider is not supported
        ModelNotFoundError: If the model is not found
        ModelServiceError: If fetching model details fails
    """
    try:
        logger.info(f"Fetching model details for {provider}/{model_id}")
        
        # Validate provider
        if provider not in ["ollama", "huggingface"]:
            raise ValidationError(
                message=f"Unsupported provider: {provider}",
                details={"provider": provider, "supported": ["ollama", "huggingface"]}
            )
        
        # Get model details from the appropriate service
        if provider == "huggingface":
            model = await hf_service.get_model_info(model_id)
        elif provider == "ollama":
            model = await ollama_service.get_model_info(model_id)
        
        # Check if model was found
        if not model:
            raise ModelNotFoundError(model_id=model_id, provider=provider)
            
        logger.info(f"Retrieved details for {provider}/{model_id}")
        return model
        
    except (ValidationError, ModelNotFoundError):
        # Re-raise known exceptions to be handled by the global error handler
        raise
    except Exception as e:
        logger.error(f"Error fetching model details: {str(e)}")
        raise ModelServiceError(
            message=f"Failed to fetch model details: {str(e)}",
            details={"provider": provider, "model_id": model_id}
        )