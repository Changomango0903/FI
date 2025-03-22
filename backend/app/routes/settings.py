from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from app.utils.logger import get_logger
from app.utils.exceptions import ValidationError
from typing import Dict, Any

# Initialize router
router = APIRouter()
logger = get_logger(__name__)

class TemperatureUpdate(BaseModel):
    """Request for updating temperature setting"""
    temperature: float = Field(
        ..., 
        ge=0.0, 
        le=1.0, 
        description="Sampling temperature for model generation (0.0 to 1.0)"
    )

@router.post("/settings/temperature", response_model=Dict[str, Any])
async def update_temperature(update: TemperatureUpdate):
    """
    Update the temperature setting for generative models
    
    Args:
        update: The temperature update request
        
    Returns:
        Dictionary with status and updated temperature
        
    Raises:
        ValidationError: If temperature is outside allowed range
    """
    try:
        # Validate temperature is within accepted range (already checked by Pydantic)
        # This is a belt-and-suspenders check
        if update.temperature < 0.0 or update.temperature > 1.0:
            raise ValidationError(
                message="Temperature must be between 0.0 and 1.0",
                details={"temperature": update.temperature, "allowed_range": "0.0 to 1.0"}
            )
        
        # Log the temperature change
        logger.info(f"TEMPERATURE SETTING UPDATED: {update.temperature}")
        
        return {
            "status": "success", 
            "temperature": update.temperature,
            "message": f"Temperature updated to {update.temperature}"
        }
    except ValidationError:
        # Re-raise validation errors to be handled by the global handler
        raise
    except Exception as e:
        logger.error(f"Error updating temperature setting: {str(e)}")
        raise ValidationError(
            message=f"Error updating temperature setting: {str(e)}",
            details={"temperature": update.temperature}
        )