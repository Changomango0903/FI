# app/services/ollama_service.py (continued)

from app.config import settings
from app.models.schema import ModelInfo, ModelDetail
import aiohttp
from typing import List, Dict, Any, AsyncGenerator, Optional
import logging
import json
import asyncio

# Configure logger for this module
logger = logging.getLogger(__name__)

class OllamaService:
    """Service for interacting with Ollama models.
    
    Provides methods to interact with locally hosted Ollama models.
    """
    
    def __init__(self):
        """Initialize the Ollama service with configuration."""
        self.base_url = settings.OLLAMA_BASE_URL
        logger.info(f"Initialized Ollama service with base URL: {self.base_url}")

    async def list_models(self) -> List[ModelInfo]:
        """List available models from Ollama.
        
        Returns:
            A list of ModelInfo objects representing available models
            
        Note:
            Returns an empty list if Ollama is not accessible
        """
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{self.base_url}/api/tags", timeout=5) as response:
                    if response.status != 200:
                        logger.warning(f"Failed to fetch Ollama models: {response.status}")
                        return []
                    
                    data = await response.json()
                    models = []
                    
                    for model in data.get("models", []):
                        model_name = model.get("name", "")
                        try:
                            # Try to get extra model info but don't fail if it's not available
                            model_info = await self._get_model_metadata(model_name)
                            description = model_info.get("description", f"Ollama model: {model_name}")
                            
                            # Extract additional metadata where available
                            parameter_size = model_info.get("parameter_size")
                            context_length = model_info.get("context_length")
                            family = self._extract_model_family(model_name)
                            
                            metadata = None
                            if any([parameter_size, context_length, family]):
                                metadata = {
                                    "family": family,
                                    "parameter_size": parameter_size,
                                    "context_length": context_length
                                }
                            
                            models.append(
                                ModelInfo(
                                    id=model_name,
                                    name=self._format_model_name(model_name),
                                    provider="ollama",
                                    description=description,
                                    metadata=metadata
                                )
                            )
                        except Exception as e:
                            # Just log warning and use a default description
                            logger.warning(f"Failed to fetch metadata for model {model_name}: {str(e)}")
                            models.append(
                                ModelInfo(
                                    id=model_name,
                                    name=self._format_model_name(model_name),
                                    provider="ollama",
                                    description=f"Ollama model: {model_name}"
                                )
                            )
                    
                    logger.info(f"Retrieved {len(models)} models from Ollama")
                    return models
            except aiohttp.ClientError as e:
                logger.error(f"Connection error fetching models from Ollama: {str(e)}")
                return []
            except Exception as e:
                logger.error(f"Unexpected error fetching models from Ollama: {str(e)}", exc_info=True)
                return []

    async def _get_model_metadata(self, model_id: str) -> Dict[str, Any]:
        """Get detailed metadata about a model.
        
        Args:
            model_id: The ID of the model
            
        Returns:
            A dictionary of model metadata
            
        Note:
            Returns a basic description if detailed metadata is not available
        """
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/api/show", 
                    json={"name": model_id},
                    timeout=5
                ) as response:
                    if response.status != 200:
                        return {"description": f"Ollama model: {model_id}"}
                    return await response.json()
            except Exception as e:
                logger.error(f"Error fetching model metadata: {str(e)}")
                return {"description": f"Ollama model: {model_id}"}

    def _extract_model_family(self, model_id: str) -> Optional[str]:
        """Extract the model family name from the model ID.
        
        Args:
            model_id: The ID of the model
            
        Returns:
            The extracted model family name or None if it cannot be determined
        """
        try:
            # Most Ollama models use format: family:tag
            parts = model_id.split(':')
            if len(parts) > 1:
                return parts[0].lower()
            
            # If no colon, try to extract based on common naming patterns
            if '-' in model_id:
                return model_id.split('-')[0].lower()
            
            # Just return the model ID if we can't parse it
            return model_id.lower()
        except Exception:
            return None

    def _format_model_name(self, model_id: str) -> str:
        """Format model ID into a human-readable name.
        
        Args:
            model_id: The ID of the model
            
        Returns:
            A formatted display name for the model
        """
        try:
            # Get base name (before colon)
            base_name = model_id.split(':')[0]
            
            # Capitalize and handle special cases
            if '-' in base_name:
                # Handle names like "llama-2"
                parts = base_name.split('-')
                return ' '.join(part.capitalize() for part in parts)
            
            # Handle alphanumeric model names like "llama3"
            import re
            # Split by numbers but keep them
            parts = re.findall(r'[A-Za-z]+|\d+', base_name)
            return ' '.join(part.capitalize() for part in parts)
        except Exception:
            # Fall back to simple capitalization
            return model_id.split(':')[0].capitalize()

    async def get_model_info(self, model_id: str) -> ModelDetail:
        """Get detailed information about a specific Ollama model.
        
        Args:
            model_id: The ID of the model
            
        Returns:
            Detailed model information
            
        Note:
            Returns basic model info even if detailed information cannot be retrieved
        """
        async with aiohttp.ClientSession() as session:
            try:
                # Try to get model metadata from Ollama
                model_data = await self._get_model_metadata(model_id)
                
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
                
                # Extract model family
                family = self._extract_model_family(model_id)
                
                # Create metadata
                metadata = None
                if any([parameter_size, context_length, family]):
                    metadata = {
                        "family": family,
                        "parameter_size": parameter_size,
                        "context_length": context_length
                    }
                
                return ModelDetail(
                    id=model_id,
                    name=self._format_model_name(model_id),
                    provider="ollama",
                    description=description,
                    parameters=parameters,
                    metadata=metadata,
                    context_length=context_length,
                    capabilities=["text-generation", "chat"]
                )
            except Exception as e:
                logger.error(f"Error fetching model info from Ollama: {str(e)}", exc_info=True)
                # Return basic model info even if there's an error
                return ModelDetail(
                    id=model_id,
                    name=self._format_model_name(model_id),
                    provider="ollama",
                    description=f"Ollama model: {model_id}",
                    parameters=None,
                    context_length=4096,
                    capabilities=["text-generation", "chat"]
                )

    async def generate_text(self, model_id: str, prompt: str, params: Dict[str, Any]) -> str:
        """Generate text using an Ollama model.
        
        Args:
            model_id: The ID of the model to use
            prompt: The prompt text to send to the model
            params: Generation parameters
            
        Returns:
            Generated text
            
        Raises:
            Exception: If text generation fails
        """
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
                
                logger.debug(f"Sending generation request to Ollama with params: {ollama_params}")
                
                async with session.post(
                    f"{self.base_url}/api/generate",
                    json=ollama_params,
                    timeout=30  # Longer timeout for generation
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
                        # For NDJSON, read the complete response text
                        text = await response.text()
                        return self._process_ndjson_response(text)
                    else:
                        # Fall back to text
                        text = await response.text()
                        return text
            except aiohttp.ClientError as e:
                logger.error(f"Connection error generating text with Ollama: {str(e)}")
                raise Exception(f"Connection error: {str(e)}")
            except Exception as e:
                logger.error(f"Error generating text with Ollama: {str(e)}", exc_info=True)
                raise

    def _process_ndjson_response(self, text: str) -> str:
        """Process NDJSON response from Ollama.
        
        Args:
            text: The NDJSON response text
            
        Returns:
            Concatenated response text
        """
        lines = [line for line in text.split('\n') if line.strip()]
        if not lines:
            return ""
        
        # Try to parse each line as JSON and extract the response
        full_response = ""
        try:
            for line in lines:
                json_obj = json.loads(line)
                if "response" in json_obj:
                    full_response += json_obj.get("response", "")
            return full_response
        except json.JSONDecodeError:
            # If we can't parse as JSON, return the raw text
            logger.warning("Failed to parse NDJSON response, returning raw text")
            return text

    async def generate_stream(self, model_id: str, prompt: str, params: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """Stream text generation using an Ollama model.
        
        Args:
            model_id: The ID of the model to use
            prompt: The prompt text to send to the model
            params: Generation parameters
            
        Yields:
            Tokens of the generated response as they become available
            
        Raises:
            Exception: If streaming fails
        """
        async with aiohttp.ClientSession() as session:
            try:
                # Map our standardized params to Ollama's expected format
                ollama_params = {
                    "model": model_id,
                    "prompt": prompt,
                    "temperature": params.get("temperature", 0.7),
                    "num_predict": params.get("max_tokens", 1024),
                    "stream": True,  # Important: set this to True for streaming
                }
                
                logger.debug(f"Sending streaming request to Ollama for model {model_id}")
                
                async with session.post(
                    f"{self.base_url}/api/generate",
                    json=ollama_params,
                    timeout=30  # Longer timeout for streaming
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
                            except json.JSONDecodeError as e:
                                logger.warning(f"Error parsing JSON in Ollama stream: {str(e)}")
                            except Exception as e:
                                logger.error(f"Error processing Ollama stream: {str(e)}")
            except aiohttp.ClientError as e:
                logger.error(f"Connection error streaming text with Ollama: {str(e)}")
                raise Exception(f"Connection error: {str(e)}")
            except Exception as e:
                logger.error(f"Error streaming text with Ollama: {str(e)}", exc_info=True)
                raise