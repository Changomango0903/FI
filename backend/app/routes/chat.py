from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from typing import Dict, List, Any
import json

from app.models.schema import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.utils.logger import get_logger
from app.utils.exceptions import BaseAppException, ModelServiceError

# Initialize router
router = APIRouter()
logger = get_logger(__name__)

# Dependency for chat service
def get_chat_service() -> ChatService:
    """Dependency to get chat service instance"""
    return ChatService()


@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(
    request: ChatRequest, 
    chat_service: ChatService = Depends(get_chat_service)
):
    """
    Generate a chat response (non-streaming)
    
    Args:
        request: Chat generation request with messages and parameters
        chat_service: ChatService instance (dependency injected)
        
    Returns:
        ChatResponse with generated response text and optional thinking content
        
    Raises:
        HTTPException: On validation or generation errors
    """
    try:
        # Log the incoming request
        logger.info(f"Chat request: provider={request.provider}, model={request.model_id}")
        logger.debug(f"Messages: {[msg.get('content', '')[:50] + '...' for msg in request.messages]}")
        
        # Generate response
        response_data = await chat_service.generate_response(
            provider=request.provider,
            model_id=request.model_id,
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        # Extract response text and thinking content
        response_text = response_data.get("response", "")
        thinking_content = response_data.get("thinking")
        
        # Log response info (truncated)
        response_preview = response_text[:50] + "..." if len(response_text) > 50 else response_text
        logger.info(f"Generated response ({len(response_text)} chars): {response_preview}")
        
        if thinking_content:
            thinking_preview = thinking_content[:50] + "..." if len(thinking_content) > 50 else thinking_content
            logger.debug(f"Generated thinking content ({len(thinking_content)} chars): {thinking_preview}")
        
        # Return structured response
        return ChatResponse(
            response=response_text,
            thinking=thinking_content if request.show_thinking else None
        )
    except BaseAppException as e:
        # Application exceptions are already logged and will be handled by the exception handler
        raise
    except Exception as e:
        # Unexpected exceptions should be converted to ModelServiceError
        logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        raise ModelServiceError(
            message=f"Error generating chat response: {str(e)}",
            details={"provider": request.provider, "model_id": request.model_id}
        )


@router.websocket("/chat/stream")
async def chat_stream(
    websocket: WebSocket,
    chat_service: ChatService = Depends(get_chat_service)
):
    """
    Generate a streaming chat response over WebSocket
    
    The client should send a JSON message with the same structure as
    the ChatRequest model. The server will stream back tokens as they
    are generated.
    """
    await websocket.accept()
    
    try:
        # Continuous WebSocket connection until client disconnects
        while True:
            # Receive the chat request as JSON
            data = await websocket.receive_text()
            request_data = json.loads(data)
            
            # Log the incoming WebSocket request
            provider = request_data.get("provider", "unknown")
            model_id = request_data.get("model_id", "unknown")
            messages = request_data.get("messages", [])
            
            logger.info(f"WebSocket chat request: provider={provider}, model={model_id}")
            logger.debug(f"WebSocket messages: {[msg.get('content', '')[:50] + '...' for msg in messages]}")
            
            # Extract parameters
            temperature = request_data.get("temperature", 0.7)
            max_tokens = request_data.get("max_tokens", 1024)
            show_thinking = request_data.get("show_thinking", True)
            
            # Initialize token counters
            token_count = 0
            thinking_token_count = 0
            
            # Stream generation
            try:
                async for token_data in chat_service.generate_stream(
                    provider=provider,
                    model_id=model_id,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                ):
                    # Extract token and type (response or thinking)
                    token = token_data.get("token", "")
                    token_type = token_data.get("type", "response")
                    
                    # Only send thinking tokens if show_thinking is True
                    if token_type == "thinking" and not show_thinking:
                        thinking_token_count += 1
                        continue
                    
                    # Count tokens based on type
                    if token_type == "response":
                        token_count += 1
                        if token_count % 50 == 0:  # Log occasionally to avoid flooding
                            logger.debug(f"Streaming: {token_count} response tokens sent")
                    else:  # thinking token
                        thinking_token_count += 1
                    
                    # Send each token with its type
                    await websocket.send_json({
                        "token": token,
                        "type": token_type
                    })
                
                # Log stream completion
                logger.info(f"Completed streaming: {token_count} response tokens, {thinking_token_count} thinking tokens")
                
                # Send a completion signal
                await websocket.send_json({"done": True})
                
            except BaseAppException as e:
                # Send structured error to client
                logger.warning(f"Application error during streaming: {e.message}")
                await websocket.send_json({
                    "error": True,
                    "message": e.message,
                    "details": e.details
                })
            except Exception as e:
                # Send general error for unexpected exceptions
                logger.error(f"Unexpected error during streaming: {str(e)}")
                await websocket.send_json({
                    "error": True,
                    "message": f"Error generating streaming response: {str(e)}"
                })
                
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except json.JSONDecodeError as e:
        logger.warning(f"Invalid JSON received on WebSocket: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected WebSocket error: {str(e)}")