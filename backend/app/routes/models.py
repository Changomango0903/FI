# app/routes/models.py

from fastapi import APIRouter, HTTPException, Depends, Query
from app.services.hf_service import HuggingFaceService
from app.services.ollama_service import OllamaService
from app.models.schema import ModelList, ModelDetail, ModelInfo
from app.config import settings
import asyncio
import logging
from typing import List, Dict, Optional

# Configure logger for this module
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services
hf_service = HuggingFaceService()
ollama_service = OllamaService()

async def get_cached_models(force_refresh: bool = False) -> List[ModelInfo]:
    """Helper function to fetch and potentially cache models.
    
    Args:
        force_refresh: Whether to force a refresh of cached models
        
    Returns:
        List of available models
    """
    # TODO: Implement proper caching with TTL (Time To Live)
    # For now, we'll just fetch the models each time
    
    # Run both requests concurrently for better performance
    hf_task = asyncio.create_task(hf_service.list_models())
    ollama_task = asyncio.create_task(ollama_service.list_models())
    
    # Wait for both to complete
    hf_models, ollama_models = await asyncio.gather(hf_task, ollama_task)
    
    return combine_model_lists(hf_models, ollama_models)

def combine_model_lists(hf_models: List[ModelInfo], ollama_models: List[ModelInfo]) -> List[ModelInfo]:
    """Combine model lists from different providers into a single list.
    
    Args:
        hf_models: List of HuggingFace models
        ollama_models: List of Ollama models
        
    Returns:
        Combined list of models with defaults included
    """
    # Create a combined list, starting with HuggingFace models
    all_models = list(hf_models)
    
    # Create a map of existing Ollama models by ID for quick lookup
    ollama_model_map = {model.id: model for model in ollama_models}
    
    # Process Ollama models - use real models where available, fall back to defaults
    default_ollama_models = [model for model in settings.DEFAULT_MODELS 
                            if model["provider"] == "ollama"]
    
    # For each default model, use the real one if available, otherwise use the default
    for default_model in default_ollama_models:
        model_id = default_model["id"]
        
        if model_id in ollama_model_map:
            # Use the real model from Ollama
            all_models.append(ollama_model_map[model_id])
            # Remove from map to track used models
            del ollama_model_map[model_id]
        else:
            # Use the default model definition
            all_models.append(ModelInfo(
                id=model_id,
                name=default_model["name"],
                provider="ollama",
                description=default_model["description"]
            ))
            logger.info(f"Added default model {model_id} (not installed yet)")
    
    # Add any remaining real Ollama models that weren't in the defaults
    all_models.extend(ollama_model_map.values())
    
    return all_models

@router.get("/models", response_model=ModelList)
async def get_available_models(
    force_refresh: bool = Query(False, description="Force refresh of model list cache")
):
    """Get all available models from both HuggingFace and Ollama.
    
    Args:
        force_refresh: Force refresh of model cache instead of using cached data
        
    Returns:
        List of available models
        
    Raises:
        HTTPException: If models cannot be retrieved
    """
    try:
        all_models = await get_cached_models(force_refresh)
        
        # Log the model count
        logger.info(f"Returning {len(all_models)} models")
        
        return ModelList(models=all_models)
    except Exception as e:
        logger.error(f"Failed to fetch models: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch models: {str(e)}"
        )

@router.get("/models/{provider}/{model_id}", response_model=ModelDetail)
async def get_model_details(provider: str, model_id: str):
    """Get detailed information about a specific model.
    
    Args:
        provider: The model provider (e.g., "huggingface", "ollama")
        model_id: The ID of the model
        
    Returns:
        Detailed model information
        
    Raises:
        HTTPException: If the model cannot be found or details cannot be retrieved
    """
    try:
        # Validate provider
        if provider not in ["huggingface", "ollama"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported provider: {provider}"
            )
        
        # Get model details from the appropriate service
        if provider == "huggingface":
            model = await hf_service.get_model_info(model_id)
        elif provider == "ollama":
            model = await ollama_service.get_model_info(model_id)
        else:
            # This should never happen due to the validation above,
            # but included for completeness
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported provider: {provider}"
            )
        
        if not model:
            raise HTTPException(
                status_code=404, 
                detail=f"Model {model_id} not found"
            )
        
        logger.info(f"Retrieved details for {provider}/{model_id}")
        return model
    except HTTPException:
        # Pass through HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Failed to fetch model details: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch model details: {str(e)}"
        )