# app/routes/installation.py

from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.services.library_service import LibraryService
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize the library service
library_service = LibraryService()

class ModelInstallRequest(BaseModel):
    """Request model for installing a model."""
    model_id: str
    force: bool = False

class ModelInstallResponse(BaseModel):
    """Response model for model installation status."""
    success: bool
    message: str
    model_id: str

class LibraryModel(BaseModel):
    """Pydantic model for library models."""
    id: str
    name: str
    provider: str = "ollama"
    description: Optional[str] = None
    parameter_size: Optional[float] = None
    family: Optional[str] = None
    installed: bool = False
    installable: bool = True

class LibraryResponse(BaseModel):
    """Response model for library listing."""
    models: List[LibraryModel]
    total: int

# Background task function for model installation
async def install_model_task(model_id: str):
    """Background task to install a model.
    
    Args:
        model_id: The ID of the model to install
    """
    try:
        success, message = await library_service.install_model(model_id)
        logger.info(f"Model installation background task completed: {model_id}, success: {success}")
    except Exception as e:
        logger.error(f"Error in model installation background task: {str(e)}", exc_info=True)

@router.get("/library", response_model=LibraryResponse)
async def get_library_models():
    """Get a list of models available in the Ollama library.
    
    Returns:
        List of available models with installation status
    """
    try:
        # Fetch models from the library
        library_models = await library_service.scrape_library()
        
        # Get list of installed models
        installed_models = await library_service.get_installed_models()
        
        # Mark installed models
        for model in library_models:
            model["installed"] = model["id"] in installed_models
        
        return LibraryResponse(
            models=[LibraryModel(**model) for model in library_models],
            total=len(library_models)
        )
    except Exception as e:
        logger.error(f"Error fetching library models: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch library models: {str(e)}"
        )

@router.post("/install", response_model=ModelInstallResponse)
async def install_model(request: ModelInstallRequest, background_tasks: BackgroundTasks):
    """Install a model from the Ollama library.
    
    Args:
        request: The model installation request
        background_tasks: FastAPI background tasks
        
    Returns:
        Installation status
    """
    try:
        model_id = request.model_id
        logger.info(f"Installing model: {model_id}")
        
        # Check if model is already installed
        installed_models = await library_service.get_installed_models()
        if model_id in installed_models and not request.force:
            return ModelInstallResponse(
                success=True,
                message="Model is already installed",
                model_id=model_id
            )
        
        # Start the installation in the background
        background_tasks.add_task(install_model_task, model_id)
        
        return ModelInstallResponse(
            success=True,
            message="Model installation started in the background",
            model_id=model_id
        )
    except Exception as e:
        logger.error(f"Error installing model: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to install model: {str(e)}"
        )

@router.get("/install/status/{model_id}")
async def get_installation_status(model_id: str):
    """Check if a model is installed.
    
    Args:
        model_id: The ID of the model to check
        
    Returns:
        Status of the model installation
    """
    try:
        installed_models = await library_service.get_installed_models()
        is_installed = model_id in installed_models
        
        return {
            "model_id": model_id,
            "installed": is_installed
        }
    except Exception as e:
        logger.error(f"Error checking model installation status: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check model status: {str(e)}"
        )