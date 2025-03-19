from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from app.services.chat_service import ChatService
from app.models.schema import ChatRequest, ChatResponse
import json
import logging

router = APIRouter()
chat_service = ChatService()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Generate a chat response (non-streaming)"""
    try:
        # Log the incoming request
        logger.info(f"RECEIVED CHAT REQUEST: provider={request.provider}, model={request.model_id}")
        logger.info(f"MESSAGE CONTENT: {[msg.get('content', '') for msg in request.messages]}")
        
        response = await chat_service.generate_response(
            provider=request.provider,
            model_id=request.model_id,
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        # Log the response
        logger.info(f"SENDING RESPONSE: {response[:100]}...")
        
        return ChatResponse(response=response)
    except Exception as e:
        logger.error(f"Error generating chat response: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/chat/stream")
async def chat_stream(websocket: WebSocket):
    """Generate a streaming chat response"""
    await websocket.accept()
    try:
        while True:
            # Receive the chat request
            data = await websocket.receive_text()
            request_data = json.loads(data)
            
            # Log the incoming WebSocket request
            logger.info(f"RECEIVED WEBSOCKET REQUEST: provider={request_data.get('provider')}, model={request_data.get('model_id')}")
            logger.info(f"WEBSOCKET MESSAGE CONTENT: {[msg.get('content', '') for msg in request_data.get('messages', [])]}")
            
            # Create a stream from the chat service
            token_count = 0
            async for token in chat_service.generate_stream(
                provider=request_data.get("provider"),
                model_id=request_data.get("model_id"),
                messages=request_data.get("messages", []),
                temperature=request_data.get("temperature", 0.7),
                max_tokens=request_data.get("max_tokens", 1024)
            ):
                # Log a sample of tokens (not every token to avoid flooding logs)
                token_count += 1
                if token_count % 20 == 0:  # Log every 20th token
                    logger.info(f"STREAMING TOKEN #{token_count}: {token}")
                
                # Send each token as it's generated
                await websocket.send_json({"token": token})
            
            # Log completion
            logger.info(f"COMPLETED STREAMING RESPONSE: {token_count} tokens sent")
            
            # Send a completion signal
            await websocket.send_json({"done": True})
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"Error in chat stream: {str(e)}")
        await websocket.send_json({"error": str(e)})