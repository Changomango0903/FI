# app/models/schema.py

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union

class ModelMetadata(BaseModel):
    """Additional metadata for models.
    
    Stores structured information about model capabilities and characteristics.
    """
    family: Optional[str] = None
    exact_family: Optional[str] = None
    parameter_size: Optional[Union[int, str]] = None
    parameter_count: Optional[int] = None
    context_length: Optional[int] = None
    quantization: Optional[str] = None

class ModelInfo(BaseModel):
    """Basic model information.
    
    Core information about a language model.
    """
    id: str = Field(..., description="Unique identifier for the model")
    name: str = Field(..., description="Display name of the model")
    provider: str = Field(..., description="Model provider (e.g., 'huggingface', 'ollama')")
    description: Optional[str] = Field(None, description="Description of the model's capabilities")
    metadata: Optional[ModelMetadata] = Field(None, description="Additional model metadata")

class ModelDetail(ModelInfo):
    """Detailed model information.
    
    Extended information about a language model, including capabilities
    and technical parameters.
    """
    parameters: Optional[Dict[str, Any]] = Field(None, description="Model parameters")
    context_length: Optional[int] = Field(None, description="Maximum context length in tokens") 
    capabilities: Optional[List[str]] = Field(None, description="List of model capabilities")

class ModelList(BaseModel):
    """List of available models.
    
    Container for available language models.
    """
    models: List[ModelInfo] = Field(..., description="List of available models")

class Message(BaseModel):
    """Chat message.
    
    Represents a single message in a conversation.
    """
    role: str = Field(..., description="Role of the message sender (user or assistant)")
    content: str = Field(..., description="Content of the message")

class ChatRequest(BaseModel):
    """Request for chat generation.
    
    Parameters for generating a chat response.
    """
    provider: str = Field(..., description="Model provider (e.g., 'huggingface', 'ollama')")
    model_id: str = Field(..., description="ID of the model to use")
    messages: List[Dict[str, str]] = Field(..., description="List of conversation messages")
    temperature: float = Field(0.7, ge=0.0, le=1.0, description="Temperature for generation (0.0-1.0)")
    max_tokens: int = Field(1024, gt=0, description="Maximum number of tokens to generate")
    stream: bool = Field(False, description="Whether to stream the response")

class ChatResponse(BaseModel):
    """Response from chat generation.
    
    Result of a chat generation request.
    """
    response: str = Field(..., description="Generated response text")

class TemperatureUpdate(BaseModel):
    """Request for updating temperature setting.
    
    Used to update the temperature parameter for generation.
    """
    temperature: float = Field(..., ge=0.0, le=1.0, description="New temperature value (0.0-1.0)")