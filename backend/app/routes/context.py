# backend/app/routes/context.py
from fastapi import APIRouter, HTTPException
from app.utils.token_counter import TokenCounter
from app.models.schema import ContextWindowRequest, ContextWindowInfo
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/context-window", response_model=ContextWindowInfo)
async def analyze_context_window(request: ContextWindowRequest):
    """Analyze and return information about the context window usage"""
    try:
        # Extract request data
        provider = request.provider
        model_id = request.model_id
        messages = request.messages
        
        # Estimate token usage
        token_count = TokenCounter.estimate_messages_tokens(messages, provider)
        
        # Get context window size for the model
        context_window = TokenCounter.get_provider_context_window(provider, model_id)
        
        # Calculate usage percentage
        usage_percentage = (token_count / context_window) * 100 if context_window > 0 else 0
        
        # Get message breakdown by role
        role_breakdown = {}
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            tokens = TokenCounter.estimate_tokens(content, provider)
            
            if role not in role_breakdown:
                role_breakdown[role] = {"count": 0, "tokens": 0}
            
            role_breakdown[role]["count"] += 1
            role_breakdown[role]["tokens"] += tokens
        
        # Log the analysis
        logger.info(f"Context window analysis for {provider}/{model_id}: {token_count}/{context_window} tokens ({usage_percentage:.1f}%)")
        
        # Return the context window information
        return ContextWindowInfo(
            token_count=token_count,
            context_window=context_window,
            usage_percentage=round(usage_percentage, 1),
            role_breakdown=role_breakdown,
            status="warning" if usage_percentage > 80 else "ok"
        )
        
    except Exception as e:
        logger.error(f"Error analyzing context window: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))