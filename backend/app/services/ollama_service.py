from app.config import settings
from app.models.schema import ModelInfo, ModelDetail
import aiohttp
import logging
import json

logger = logging.getLogger(__name__)

class OllamaService:
    """Service for interacting with Ollama models"""
    
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL

    async def list_models(self) -> list[ModelInfo]:
        """List available models from Ollama"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{self.base_url}/api/tags") as response:
                    if response.status != 200:
                        logger.warning(f"Failed to fetch Ollama models: {response.status}")
                        return []
                    
                    data = await response.json()
                    models = []
                    
                    for model in data.get("models", []):
                        model_name = model.get("name", "")
                        try:
                            # Try to get extra model info but don't fail if it's not available
                            model_info = await self.get_model_metadata(model_name)
                            description = model_info.get("description", f"Ollama model: {model_name}")
                        except Exception as e:
                            # Just log warning and use a default description
                            logger.warning(f"Failed to fetch metadata for model {model_name}: {response.status}")
                            description = f"Ollama model: {model_name}"
                        
                        models.append(
                            ModelInfo(
                                id=model_name,
                                name=model_name.split(":")[0].capitalize(),
                                provider="ollama",
                                description=description
                            )
                        )
                    return models
            except Exception as e:
                logger.error(f"Error fetching models from Ollama: {str(e)}")
                return []

    async def get_model_metadata(self, model_id: str) -> dict:
        """Get detailed metadata about a model but don't fail if not available"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/api/show", 
                    json={"name": model_id}
                ) as response:
                    if response.status != 200:
                        return {"description": f"Ollama model: {model_id}"}
                    return await response.json()
            except Exception as e:
                logger.error(f"Error fetching model metadata: {str(e)}")
                return {"description": f"Ollama model: {model_id}"}

    async def get_model_info(self, model_id: str) -> ModelDetail:
        """Get detailed information about a specific Ollama model"""
        async with aiohttp.ClientSession() as session:
            try:
                # Try to get model metadata from Ollama
                model_data = await self.get_model_metadata(model_id)
                
                # Extract model details from metadata if available
                description = model_data.get("description", f"Ollama model: {model_id}")
                parameter_size = model_data.get("parameter_size")
                context_length = model_data.get("context_length", 4096)
                
                # Create parameters dict if we have parameter size
                parameters = None
                if parameter_size:
                    parameters = {
                        "parameter_size": parameter_size
                    }
                
                return ModelDetail(
                    id=model_id,
                    name=model_id.split(":")[0].capitalize(),
                    provider="ollama",
                    description=description,
                    parameters=parameters,
                    context_length=context_length,
                    capabilities=["text-generation", "chat"]
                )
            except Exception as e:
                logger.error(f"Error fetching model info from Ollama: {str(e)}")
                # Return basic model info even if there's an error
                return ModelDetail(
                    id=model_id,
                    name=model_id.split(":")[0].capitalize(),
                    provider="ollama",
                    description=f"Ollama model: {model_id}",
                    parameters=None,
                    context_length=4096,
                    capabilities=["text-generation", "chat"]
                )

    async def generate_text(self, model_id: str, prompt: str, params: dict) -> str:
        """Generate text using an Ollama model"""
        async with aiohttp.ClientSession() as session:
            try:
                # Map our standardized params to Ollama's expected format
                ollama_params = {
                    "model": model_id,
                    "prompt": prompt,
                    "temperature": params.get("temperature", 0.7),
                    "num_predict": params.get("max_tokens", 1024),
                    "stream": False,  # Important: set this to False for non-streaming requests
                }
                
                async with session.post(
                    f"{self.base_url}/api/generate",
                    json=ollama_params
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Ollama API error: {error_text}")
                    
                    # Handle both JSON and NDJSON responses
                    content_type = response.headers.get('Content-Type', '')
                    if 'application/json' in content_type:
                        result = await response.json()
                        return result.get("response", "")
                    elif 'application/x-ndjson' in content_type:
                        # For NDJSON, read the last complete JSON object
                        text = await response.text()
                        lines = [line for line in text.split('\n') if line.strip()]
                        if not lines:
                            return ""
                        
                        # Get the last complete JSON object
                        try:
                            last_response = json.loads(lines[-1])
                            return last_response.get("response", "")
                        except json.JSONDecodeError:
                            # If we can't parse the last line, combine all responses
                            full_response = ""
                            for line in lines:
                                try:
                                    json_obj = json.loads(line)
                                    full_response += json_obj.get("response", "")
                                except:
                                    pass
                            return full_response
                    else:
                        # Fall back to text
                        text = await response.text()
                        return text
            except Exception as e:
                logger.error(f"Error generating text with Ollama: {str(e)}")
                raise

    async def generate_stream(self, model_id: str, prompt: str, params: dict):
        """Stream text generation using an Ollama model"""
        async with aiohttp.ClientSession() as session:
            try:
                # Map our standardized params to Ollama's expected format
                ollama_params = {
                    "model": model_id,
                    "prompt": prompt,
                    "temperature": params.get("temperature", 0.7),
                    "num_predict": params.get("max_tokens", 1024),
                    "stream": True,
                }
                
                async with session.post(
                    f"{self.base_url}/api/generate",
                    json=ollama_params
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Ollama API error: {error_text}")
                    
                    # Process the streaming response
                    async for line in response.content:
                        if line:
                            try:
                                data = line.decode("utf-8").strip()
                                if data:
                                    json_data = json.loads(data)
                                    if "response" in json_data:
                                        yield json_data["response"]
                            except Exception as e:
                                logger.error(f"Error parsing Ollama stream: {str(e)}")
            except Exception as e:
                logger.error(f"Error streaming text with Ollama: {str(e)}")
                raise