# app/routes/chat.py

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends
from app.services.chat_service import ChatService
from app.models.schema import ChatRequest, ChatResponse
import json
import logging
from typing import Dict, Any, List, Optional

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize chat service
chat_service = ChatService()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Generate a chat response (non-streaming).
    
    Args:
        request: Chat request parameters
        
    Returns:
        Generated response text
        
    Raises:
        HTTPException: If response generation fails
    """
    try:
        # Log the incoming request (sanitize sensitive information)
        logger.info(f"Received chat request: provider={request.provider}, model={request.model_id}")
        
        # Only log first message content to avoid logging sensitive information
        message_preview = ""
        if request.messages and len(request.messages) > 0:
            first_msg = request.messages[0].get('content', '')
            if first_msg and len(first_msg) > 100:
                message_preview = f"{first_msg[:97]}..."
            else:
                message_preview = first_msg
                
        logger.info(f"First message preview: {message_preview}")
        
        # Generate response
        response = await chat_service.generate_response(
            provider=request.provider,
            model_id=request.model_id,
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        # Log response length
        response_len = len(response)
        logger.info(f"Generated response of length {response_len} chars")
        
        # Return response
        return ChatResponse(response=response)
    except Exception as e:
        logger.error(f"Error generating chat response: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class WebSocketManager:
    """Manager for WebSocket connections and chat streaming."""
    
    def __init__(self):
        """Initialize WebSocket manager."""
        self.active_connections: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection.
        
        Args:
            websocket: The WebSocket connection to accept
        """
        await websocket.accept()
        self.active_connections[websocket] = {"message_count": 0}
        logger.info(f"WebSocket connection established. Active connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a disconnected WebSocket.
        
        Args:
            websocket: The WebSocket connection to remove
        """
        if websocket in self.active_connections:
            connection_info = self.active_connections.pop(websocket)
            logger.info(f"WebSocket disconnected. Messages processed: {connection_info['message_count']}. "
                       f"Active connections: {len(self.active_connections)}")
    
    async def process_message(self, websocket: WebSocket, data: Dict[str, Any]) -> None:
        """Process a message from a WebSocket client.
        
        Args:
            websocket: The WebSocket connection
            data: The message data
        """
        try:
            # Update message count
            self.active_connections[websocket]["message_count"] += 1
            
            # Extract parameters
            provider = data.get("provider")
            model_id = data.get("model_id")
            messages = data.get("messages", [])
            temperature = data.get("temperature", 0.7)
            max_tokens = data.get("max_tokens", 1024)
            
            # Log request
            logger.info(f"Received WebSocket request: provider={provider}, model={model_id}")
            
            # Stream the response
            token_count = 0
            async for token in chat_service.generate_stream(
                provider=provider,
                model_id=model_id,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            ):
                token_count += 1
                
                # Log every 20th token for debugging
                if token_count % 20 == 0:
                    logger.debug(f"Streaming token #{token_count}")
                
                # Send the token to the client
                await websocket.send_json({"token": token})
            
            # Log completion
            logger.info(f"Completed streaming response: {token_count} tokens sent")
            
            # Send completion signal
            await websocket.send_json({"done": True})
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {str(e)}", exc_info=True)
            # Send error to client
            await websocket.send_json({"error": str(e)})

# Create WebSocket manager
websocket_manager = WebSocketManager()

@router.websocket("/chat/stream")
async def chat_stream(websocket: WebSocket):
    """Generate a streaming chat response.
    
    Args:
        websocket: The WebSocket connection
    """
    await websocket_manager.connect(websocket)
    
    try:
        while True:
            # Receive the chat request
            data_raw = await websocket.receive_text()
            data = json.loads(data_raw)
            
            # Process the request
            await websocket_manager.process_message(websocket, data)
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in WebSocket message: {str(e)}")
        await websocket.send_json({"error": "Invalid JSON in request"})
        websocket_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Error in chat stream: {str(e)}", exc_info=True)
        try:
            await websocket.send_json({"error": str(e)})
        except:
            # If we can't send the error, the connection is probably already closed
            pass
        websocket_manager.disconnect(websocket)