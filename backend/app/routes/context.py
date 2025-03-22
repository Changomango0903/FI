# backend/app/routes/context.py
from fastapi import APIRouter, Depends
from app.utils.token_counter import TokenCounter
from app.utils.logger import get_logger
from app.utils.exceptions import ValidationError, ModelServiceError
from app.models.schema import ContextWindowRequest, ContextWindowInfo

# Initialize router
router = APIRouter()
logger = get_logger(__name__)

@router.post("/context-window", response_model=ContextWindowInfo)
async def analyze_context_window(request: ContextWindowRequest):
    """
    Analyze and return information about the context window usage
    
    Args:
        request: Request containing provider, model_id, and messages
        
    Returns:
        ContextWindowInfo with token count, context window size, and usage statistics
        
    Raises:
        ValidationError: If the request is invalid
        ModelServiceError: If token counting fails
    """
    try:
        # Extract request data
        provider = request.provider
        model_id = request.model_id
        messages = request.messages
        
        logger.info(f"Analyzing context window for {provider}/{model_id}")
        
        # Validate provider
        if provider not in ["ollama", "huggingface"]:
            raise ValidationError(
                message=f"Invalid provider: {provider}",
                details={"provider": provider, "supported": ["ollama", "huggingface"]}
            )
        
        # Estimate token usage
        token_count = TokenCounter.estimate_messages_tokens(messages, provider, model_id)
        
        # Get context window size for the model
        context_window = TokenCounter.get_provider_context_window(provider, model_id)
        
        # Calculate usage percentage
        usage_percentage = (token_count / context_window) * 100 if context_window > 0 else 0
        
        # Get message breakdown by role
        role_breakdown = {}
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            tokens = TokenCounter.count_tokens(content, model_id)
            
            if role not in role_breakdown:
                role_breakdown[role] = {"count": 0, "tokens": 0}
            
            role_breakdown[role]["count"] += 1
            role_breakdown[role]["tokens"] += tokens
        
        # Log the analysis
        logger.info(f"Context window analysis for {provider}/{model_id}: {token_count}/{context_window} tokens ({usage_percentage:.1f}%)")
        
        # Determine status based on usage percentage
        status = "warning" if usage_percentage > 80 else "ok"
        
        # Return the context window information
        return ContextWindowInfo(
            token_count=token_count,
            context_window=context_window,
            usage_percentage=round(usage_percentage, 1),
            role_breakdown=role_breakdown,
            status=status
        )
        
    except ValidationError:
        # Re-raise validation errors to be handled by the global error handler
        raise
    except Exception as e:
        logger.error(f"Error analyzing context window: {str(e)}")
        raise ModelServiceError(
            message=f"Error analyzing context window: {str(e)}",
            details={"provider": request.provider, "model_id": request.model_id}
        )