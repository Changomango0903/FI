from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

router = APIRouter()

class TemperatureUpdate(BaseModel):
    """Request for updating temperature setting"""
    temperature: float

@router.post("/settings/temperature")
async def update_temperature(update: TemperatureUpdate):
    """Update the temperature setting for generative models"""
    try:
        # Validate temperature is within accepted range
        if update.temperature < 0.0 or update.temperature > 1.0:
            raise HTTPException(status_code=400, detail="Temperature must be between 0.0 and 1.0")
        
        # Log the temperature change
        logger.info(f"TEMPERATURE SETTING UPDATED: {update.temperature}")
        
        return {"status": "success", "temperature": update.temperature}
    except Exception as e:
        logger.error(f"Error updating temperature setting: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))