from fastapi import APIRouter, HTTPException, Depends
from app.services.hf_service import HuggingFaceService
from app.services.ollama_service import OllamaService
from app.models.schema import ModelList, ModelDetail
from app.config import settings
import asyncio

router = APIRouter()
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
        
        # Combine the results
        all_models = hf_models + ollama_models
        
        return ModelList(models=all_models)
    except Exception as e:
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch model details: {str(e)}")