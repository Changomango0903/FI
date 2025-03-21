from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class ModelMetadata(BaseModel):
    """Additional metadata for models"""
    family: Optional[str] = None
    exact_family: Optional[str] = None
    parameter_size: Optional[int] = None
    parameter_count: Optional[int] = None
    context_length: Optional[int] = None
    quantization: Optional[str] = None

class ModelInfo(BaseModel):
    """Basic model information"""
    id: str
    name: str
    provider: str
    description: Optional[str] = None
    metadata: Optional[ModelMetadata] = None

class ModelDetail(ModelInfo):
    """Detailed model information"""
    parameters: Optional[Dict[str, Any]] = None
    context_length: Optional[int] = None
    capabilities: Optional[List[str]] = None

class ModelList(BaseModel):
    """List of available models"""
    models: List[ModelInfo]

class Message(BaseModel):
    """Chat message"""
    role: str
    content: str

class ChatRequest(BaseModel):
    """Request for chat generation"""
    provider: str
    model_id: str
    messages: List[Dict[str, str]]
    temperature: float = 0.7
    max_tokens: int = 1024
    stream: bool = False

class ChatResponse(BaseModel):
    """Response from chat generation"""
    response: str