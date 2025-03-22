from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union

class ModelInfo(BaseModel):
    """Basic model information"""
    id: str = Field(..., description="Unique identifier for the model")
    name: str = Field(..., description="Display name of the model")
    provider: str = Field(..., description="Provider of the model (e.g., 'ollama', 'huggingface')")
    description: Optional[str] = Field(None, description="Description of the model")
    has_reasoning: bool = Field(False, description="Whether the model has reasoning/thinking capabilities")
    
    class Config:
        # Avoid warning about model_id
        protected_namespaces = ()

class ModelDetail(ModelInfo):
    """Detailed model information"""
    parameters: Optional[Dict[str, Any]] = Field(None, description="Available parameters for the model")
    context_length: Optional[int] = Field(None, description="Max context length in tokens")
    capabilities: Optional[List[str]] = Field(None, description="Model capabilities (e.g., 'text-generation', 'chat')")

class ModelList(BaseModel):
    """List of available models"""
    models: List[ModelInfo] = Field(..., description="List of available models")

class Message(BaseModel):
    """Chat message"""
    role: str = Field(..., description="Role of the message sender (e.g., 'user', 'assistant', 'system')")
    content: str = Field(..., description="Content of the message")
    thinking: Optional[str] = Field(None, description="Optional thinking content for reasoning models")

class ChatRequest(BaseModel):
    """Request for chat generation"""
    provider: str = Field(..., description="Provider of the model (e.g., 'ollama', 'huggingface')")
    model_id: str = Field(..., description="ID of the model to use")
    messages: List[Dict[str, str]] = Field(..., description="List of chat messages")
    temperature: float = Field(0.7, ge=0.0, le=1.0, description="Sampling temperature (0.0 to 1.0)")
    max_tokens: int = Field(1024, gt=0, description="Maximum number of tokens to generate")
    stream: bool = Field(False, description="Whether to stream the response")
    show_thinking: bool = Field(True, description="Whether to show thinking content in response")
    
    class Config:
        # Avoid warning about model_id
        protected_namespaces = ()

class ChatResponse(BaseModel):
    """Response from chat generation"""
    response: str = Field(..., description="Generated response text")
    thinking: Optional[str] = Field(None, description="Optional thinking content for reasoning models")

class ContextWindowRequest(BaseModel):
    """Request for context window analysis"""
    provider: str = Field(..., description="Provider of the model (e.g., 'ollama', 'huggingface')")
    model_id: str = Field(..., description="ID of the model to analyze")
    messages: List[Dict[str, str]] = Field(..., description="List of chat messages")
    
    class Config:
        # Avoid warning about model_id
        protected_namespaces = ()

class RoleBreakdown(BaseModel):
    """Token breakdown by role"""
    count: int = Field(..., description="Number of messages for this role")
    tokens: int = Field(..., description="Total tokens used by this role")

class ContextWindowInfo(BaseModel):
    """Information about context window usage"""
    token_count: int = Field(..., description="Total token count of the messages")
    context_window: int = Field(..., description="Maximum context window size for the model")
    usage_percentage: float = Field(..., description="Percentage of context window used")
    role_breakdown: Dict[str, RoleBreakdown] = Field(..., description="Breakdown of tokens by role")
    status: str = Field(..., description="Status of context window usage ('ok' or 'warning')")