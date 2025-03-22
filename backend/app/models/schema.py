from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union

class ModelInfo(BaseModel):
    """Basic model information"""
    id: str
    name: str
    provider: str
    description: Optional[str] = None
    has_reasoning: Optional[bool] = False  # Flag for models with reasoning/thinking capabilities

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
    thinking: Optional[str] = None  # Optional thinking content for reasoning models

class ChatRequest(BaseModel):
    """Request for chat generation"""
    provider: str
    model_id: str
    messages: List[Dict[str, str]]
    temperature: float = 0.7
    max_tokens: int = 1024
    stream: bool = False
    show_thinking: bool = True  # Whether to show thinking content in response

class ChatResponse(BaseModel):
    """Response from chat generation"""
    response: str
    thinking: Optional[str] = None  # Optional thinking content for reasoning models

class ContextWindowRequest(BaseModel):
    """Request for context window analysis"""
    provider: str
    model_id: str
    messages: List[Dict[str, str]]

class RoleBreakdown(BaseModel):
    """Token breakdown by role"""
    count: int
    tokens: int

class ContextWindowInfo(BaseModel):
    """Information about context window usage"""
    token_count: int
    context_window: int
    usage_percentage: float
    role_breakdown: Dict[str, RoleBreakdown]
    status: str  # "ok" or "warning"