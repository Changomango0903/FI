from fastapi import APIRouter, HTTPException, Depends
from app.services.hf_service import HuggingFaceService
from app.services.ollama_service import OllamaService
from app.models.schema import ModelList, ModelDetail, ModelInfo
from app.config import settings
import asyncio
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

hf_service = HuggingFaceService()
ollama_service = OllamaService()

@router.get("/models", response_model=ModelList)
async def get_available_models():
    """Get all available models from both HuggingFace and Ollama"""
    try:
        # Run both requests concurrently for better performance
        hf_task = asyncio.create_task(hf_service.list_models())
        ollama_task = asyncio.create_task(ollama_service.list_models())
        
        # Wait for both to complete
        hf_models, ollama_models = await asyncio.gather(hf_task, ollama_task)
        
        # Create a combined list, ensuring all default models are included
        all_models = hf_models.copy()
        
        # Create a map of existing Ollama models by ID for quick lookup
        ollama_model_map = {model.id: model for model in ollama_models}
        
        # Process Ollama models - use real models where available, fall back to defaults
        default_ollama_models = [model for model in settings.DEFAULT_MODELS if model["provider"] == "ollama"]
        
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
        
        # Log the model count
        logger.info(f"Returning {len(all_models)} models ({len(hf_models)} HF, {len(ollama_models)} Ollama)")
        
        return ModelList(models=all_models)
    except Exception as e:
        logger.error(f"Failed to fetch models: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch models: {str(e)}")

@router.get("/models/{provider}/{model_id}", response_model=ModelDetail)
async def get_model_details(provider: str, model_id: str):
    """Get detailed information about a specific model"""
    try:
        if provider == "huggingface":
            model = await hf_service.get_model_info(model_id)
        elif provider == "ollama":
            model = await ollama_service.get_model_info(model_id)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
        
        if not model:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
            
        return model
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch model details: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch model details: {str(e)}")