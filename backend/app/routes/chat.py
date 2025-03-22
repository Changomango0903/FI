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
        
        # Log the response
        logger.info(f"SENDING RESPONSE: {response_text[:100]}...")
        if thinking_content:
            logger.info(f"THINKING CONTENT: {thinking_content[:100]}...")
        
        # Include thinking content in the response if available
        return ChatResponse(
            response=response_text,
            thinking=thinking_content
        )
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
            thinking_token_count = 0
            
            async for token_data in chat_service.generate_stream(
                provider=request_data.get("provider"),
                model_id=request_data.get("model_id"),
                messages=request_data.get("messages", []),
                temperature=request_data.get("temperature", 0.7),
                max_tokens=request_data.get("max_tokens", 1024)
            ):
                # Extract token and type (response or thinking)
                token = token_data.get("token", "")
                token_type = token_data.get("type", "response")
                
                # Count tokens based on type
                if token_type == "response":
                    token_count += 1
                    if token_count % 20 == 0:  # Log every 20th response token
                        logger.info(f"STREAMING RESPONSE TOKEN #{token_count}: {token}")
                else:  # thinking token
                    thinking_token_count += 1
                    if thinking_token_count % 20 == 0:  # Log every 20th thinking token
                        logger.info(f"STREAMING THINKING TOKEN #{thinking_token_count}: {token}")
                
                # Send each token with its type
                await websocket.send_json({
                    "token": token,
                    "type": token_type
                })
            
            # Log completion
            logger.info(f"COMPLETED STREAMING RESPONSE: {token_count} response tokens, {thinking_token_count} thinking tokens sent")
            
            # Send a completion signal
            await websocket.send_json({"done": True})
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"Error in chat stream: {str(e)}")
        try:
            await websocket.send_json({"error": str(e)})
        except:
            logger.error("Could not send error message to client")