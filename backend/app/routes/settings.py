# app/routes/settings.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.schema import TemperatureUpdate
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

class SettingsResponse(BaseModel):
    """Generic response model for settings endpoints."""
    status: str
    message: str
    data: Dict[str, Any]

@router.post("/settings/temperature", response_model=SettingsResponse)
async def update_temperature(update: TemperatureUpdate):
    """Update the temperature setting for generative models.
    
    Args:
        update: The temperature update request
        
    Returns:
        Response confirming the update
        
    Raises:
        HTTPException: If temperature is out of range or update fails
    """
    try:
        # Validate temperature is within accepted range (redundant with Pydantic validation,
        # but kept as an extra safety measure)
        if update.temperature < 0.0 or update.temperature > 1.0:
            raise HTTPException(
                status_code=400, 
                detail="Temperature must be between 0.0 and 1.0"
            )
        
        # Log the temperature change
        logger.info(f"Temperature setting updated: {update.temperature}")
        
        # In a real application, you might store this in a database or
        # configuration store for persistence across restarts
        
        return SettingsResponse(
            status="success",
            message="Temperature updated successfully",
            data={"temperature": update.temperature}
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error updating temperature setting: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to update temperature: {str(e)}"
        )

# Additional settings endpoints can be added here