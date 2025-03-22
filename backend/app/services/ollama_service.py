from app.config import settings
from app.models.schema import ModelInfo, ModelDetail
import aiohttp
import logging
import json
from typing import List, Dict, Any, AsyncGenerator, Optional
from app.services.base_service import BaseModelService
from app.utils.exceptions import ModelServiceError
import time
from app.utils.logger import get_logger
import re

logger = logging.getLogger(__name__)

class OllamaService(BaseModelService):
    """Service for interacting with Ollama models"""
    
    def __init__(self):
        """Initialize the Ollama service with base URL from settings"""
        super().__init__()
        self.base_url = settings.OLLAMA_BASE_URL
        self.model_metadata_cache = {}  # Cache for model metadata
        self.model_info_cache = {}  # Cache for model info
        self.cache_ttl = 3600  # Cache TTL in seconds (1 hour)
        self.logger = get_logger(__name__)

    async def list_models(self) -> list[ModelInfo]:
        """List available models from Ollama"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{self.base_url}/api/tags") as response:
                    if response.status != 200:
                        self.logger.warning(f"Failed to fetch Ollama models: {response.status}")
                        return []
                    
                    # Parse JSON response safely
                    try:
                        data = await response.json()
                    except Exception as json_error:
                        self.logger.error(f"Error parsing Ollama API response: {str(json_error)}")
                        return []
                    
                    # Validate response structure
                    if not isinstance(data, dict):
                        self.logger.error(f"Unexpected response format from Ollama API: {type(data)}")
                        return []
                    
                    models_list = data.get("models", [])
                    if not isinstance(models_list, list):
                        self.logger.error(f"Unexpected 'models' format in Ollama API response: {type(models_list)}")
                        return []
                    
                    models = []
                    
                    # Clear expired cache entries
                    now = time.time()
                    expired_keys = [k for k, v in self.model_metadata_cache.items() 
                                    if now - v.get('timestamp', 0) > self.cache_ttl]
                    for key in expired_keys:
                        del self.model_metadata_cache[key]
                    
                    for model in models_list:
                        if not isinstance(model, dict):
                            self.logger.warning(f"Skipping invalid model entry: {model}")
                            continue
                            
                        model_name = model.get("name", "")
                        if not model_name:
                            self.logger.warning("Skipping model with empty name")
                            continue
                        
                        try:
                            # Try to get context window from model metadata
                            context_length = await self._get_model_context_length(model_name)
                            has_reasoning = self._check_model_reasoning_capability(model_name)
                            
                            models.append(
                                ModelInfo(
                                    id=model_name,
                                    name=model_name.split(":")[0].capitalize(),
                                    provider="ollama",
                                    description=f"Ollama model: {model_name}",
                                    has_reasoning=has_reasoning
                                )
                            )
                        except Exception as model_error:
                            self.logger.warning(f"Error processing model {model_name}: {str(model_error)}")
                            continue
                    
                    self.logger.info(f"Returning {len(models)} Ollama models")
                    return models
            except Exception as e:
                self.logger.error(f"Error fetching models from Ollama: {str(e)}")
                return []

    async def _get_model_metadata(self, model_id: str) -> Dict[str, Any]:
        """
        Get detailed metadata for a model by querying Ollama API
        
        Args:
            model_id: The model ID to query
            
        Returns:
            Dictionary containing model metadata
        """
        # Check cache first
        if model_id in self.model_metadata_cache:
            cache_entry = self.model_metadata_cache[model_id]
            # Check if cache is still valid
            if time.time() - cache_entry.get('timestamp', 0) < self.cache_ttl:
                self.logger.debug(f"Using cached metadata for {model_id}")
                data = cache_entry.get('data', {})
                if not isinstance(data, dict):
                    self.logger.warning(f"Cached metadata for {model_id} is not a dictionary")
                    return {}
                return data
        
        self.logger.info(f"Fetching model metadata for {model_id} from Ollama API")
        
        try:
            # Use the /api/show endpoint to get model info
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/show", 
                    json={"name": model_id}
                ) as response:
                    if response.status != 200:
                        self.logger.warning(f"Failed to fetch model metadata for {model_id}: {response.status}")
                        return {}
                    
                    # Safely parse JSON response
                    try:
                        metadata = await response.json()
                    except Exception as json_error:
                        self.logger.error(f"Error parsing metadata JSON for {model_id}: {str(json_error)}")
                        return {}
                    
                    # Validate response format
                    if not isinstance(metadata, dict):
                        self.logger.warning(f"Metadata for {model_id} is not a dictionary, got {type(metadata)}")
                        return {}
                    
                    # Cache the result
                    self.model_metadata_cache[model_id] = {
                        'data': metadata,
                        'timestamp': time.time()
                    }
                    
                    return metadata
        except Exception as e:
            self.logger.error(f"Error fetching model metadata for {model_id}: {str(e)}")
            return {}

    async def _get_model_context_length(self, model_id: str) -> int:
        """
        Get the context length for a model
        
        Args:
            model_id: The model ID
            
        Returns:
            The context length in tokens
        """
        metadata = await self._get_model_metadata(model_id)
        
        # Validate that metadata is a dictionary
        if not isinstance(metadata, dict):
            self.logger.warning(f"Metadata for {model_id} is not a dictionary, got {type(metadata)}")
            return self._get_default_context_length(model_id)
            
        # Extract context length from metadata
        try:
            # Check if context_length is directly provided
            if 'context_length' in metadata and metadata['context_length']:
                try:
                    context_length = int(metadata['context_length'])
                    self.logger.info(f"Found direct context_length for {model_id}: {context_length}")
                    return context_length
                except (ValueError, TypeError):
                    self.logger.warning(f"Invalid context_length value for {model_id}: {metadata['context_length']}")
            
            # Get parameters - could be dict or string
            parameters = metadata.get('parameters', {})
            
            # If parameters is a dictionary, try to get num_ctx directly
            if isinstance(parameters, dict):
                context_length = parameters.get('num_ctx', None)
                if context_length:
                    self.logger.info(f"Found context length for {model_id}: {context_length}")
                    return int(context_length)
            # If parameters is a string, try to parse it
            elif isinstance(parameters, str):
                # Log the full parameters string for debugging (first 200 chars)
                param_preview = parameters[:200] + ('...' if len(parameters) > 200 else '')
                self.logger.debug(f"Parameters for {model_id} is a string: {param_preview}")
                
                # Try to parse as JSON first
                try:
                    import json
                    param_dict = json.loads(parameters)
                    if isinstance(param_dict, dict) and 'num_ctx' in param_dict:
                        context_length = param_dict.get('num_ctx')
                        self.logger.info(f"Parsed context length from JSON for {model_id}: {context_length}")
                        return int(context_length)
                except json.JSONDecodeError:
                    self.logger.debug(f"Parameters for {model_id} is not valid JSON")
                
                # Try to find num_ctx in the string using regex
                ctx_match = re.search(r'num_ctx[=:]\s*(\d+)', parameters)
                if ctx_match:
                    context_length = int(ctx_match.group(1))
                    self.logger.info(f"Found context length in parameter string for {model_id}: {context_length}")
                    return context_length
                    
                # Try to find context length with different parameter names
                ctx_match = re.search(r'context_length[=:]\s*(\d+)', parameters)
                if ctx_match:
                    context_length = int(ctx_match.group(1))
                    self.logger.info(f"Found context_length in parameter string for {model_id}: {context_length}")
                    return context_length
                    
                # Look for any number following context or ctx
                ctx_match = re.search(r'context\D+(\d+)', parameters, re.IGNORECASE)
                if ctx_match:
                    context_length = int(ctx_match.group(1))
                    self.logger.info(f"Found context number in parameter string for {model_id}: {context_length}")
                    return context_length
                
                # Log the failed parsing attempt
                self.logger.warning(f"Could not parse context length from parameter string for {model_id}")
            
            # Try to extract from modelfile if available
            model_info = metadata.get('modelfile', {})
            if isinstance(model_info, str):
                # Look for context window in modelfile
                ctx_match = re.search(r'PARAMETER\s+num_ctx\s+(\d+)', model_info)
                if ctx_match:
                    context_length = int(ctx_match.group(1))
                    self.logger.info(f"Found context length in modelfile for {model_id}: {context_length}")
                    return context_length
                    
                # Also try other parameter names
                ctx_match = re.search(r'PARAMETER\s+context_length\s+(\d+)', model_info)
                if ctx_match:
                    context_length = int(ctx_match.group(1))
                    self.logger.info(f"Found context_length in modelfile for {model_id}: {context_length}")
                    return context_length
            elif isinstance(model_info, dict):
                # Handle case where modelfile might be a dictionary with parameters
                if 'parameters' in model_info and isinstance(model_info['parameters'], dict):
                    context_length = model_info['parameters'].get('num_ctx', None)
                    if context_length:
                        self.logger.info(f"Found context length in modelfile parameters for {model_id}: {context_length}")
                        return int(context_length)
            
            # Try Ollama /api/show endpoint for details
            try:
                # Make a direct API call to get model details
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{self.base_url}/api/show", 
                        json={"name": model_id, "verbose": True}
                    ) as response:
                        if response.status == 200:
                            show_data = await response.json()
                            self.logger.debug(f"Got detailed info from /api/show for {model_id}")
                            
                            # Check if 'details' field has context length
                            details = show_data.get('details', {})
                            if isinstance(details, dict):
                                ctx_val = details.get('context_length') or details.get('num_ctx')
                                if ctx_val:
                                    self.logger.info(f"Found context length in details for {model_id}: {ctx_val}")
                                    return int(ctx_val)
                            
                            # Try parameters field under details
                            detail_params = details.get('parameters', {})
                            if isinstance(detail_params, dict):
                                ctx_val = detail_params.get('context_length') or detail_params.get('num_ctx')
                                if ctx_val:
                                    self.logger.info(f"Found context length in details.parameters for {model_id}: {ctx_val}")
                                    return int(ctx_val)
                                    
                            # Try to extract from parameter string
                            if 'parameters' in show_data and isinstance(show_data['parameters'], str):
                                param_str = show_data['parameters']
                                ctx_match = re.search(r'num_ctx[=:]\s*(\d+)', param_str)
                                if ctx_match:
                                    context_length = int(ctx_match.group(1))
                                    self.logger.info(f"Found num_ctx in verbose show parameters for {model_id}: {context_length}")
                                    return context_length
            except Exception as e:
                self.logger.warning(f"Error getting detailed info for {model_id}: {str(e)}")
            
            # Try to infer from the model name if it contains a context window size
            ctx_match = re.search(r'(\d+)[kK]', model_id)  # Look for numbers followed by 'k' or 'K'
            if ctx_match:
                try:
                    # If we find something like '8k', convert to 8192
                    k_value = int(ctx_match.group(1))
                    context_length = k_value * 1024
                    self.logger.info(f"Inferred context length from model name for {model_id}: {context_length}")
                    return context_length
                except ValueError:
                    pass
                    
            # If we can't find the context window, use model family detection
            self.logger.warning(f"Could not find context length in metadata for {model_id}, falling back to model detection")
            return self._get_default_context_length(model_id)
            
        except Exception as e:
            self.logger.warning(f"Error extracting context length for {model_id}: {str(e)}")
            self.logger.warning(f"Stack trace: ", exc_info=True)
            return self._get_default_context_length(model_id)
            
    def _get_default_context_length(self, model_id: str) -> int:
        """
        Get the default context length based on model family
        
        Args:
            model_id: The model ID
            
        Returns:
            The estimated context length in tokens
        """
        model_lower = model_id.lower()
        
        if 'llama3' in model_lower:
            return 8192
        elif 'llama2' in model_lower:
            return 4096
        elif 'mistral' in model_lower:
            return 8192
        elif 'mixtral' in model_lower:
            return 32768
        elif 'qwen' in model_lower:
            return 8192
        elif 'yi' in model_lower:
            return 4096
        elif 'deepseek' in model_lower:
            return 8192
        elif 'gemma' in model_lower:
            return 8192
        elif 'command' in model_lower:
            return 16384
        
        # Default context length
        self.logger.warning(f"Could not determine context length for {model_id}, using default")
        return 4096  # Default fallback

    def _check_model_reasoning_capability(self, model_id: str) -> bool:
        """
        Check if a model has reasoning capabilities
        
        Args:
            model_id: The model ID
            
        Returns:
            True if the model has reasoning capabilities, False otherwise
        """
        # Models known to have good reasoning capabilities
        reasoning_models = [
            "mixtral", "llama3", "qwen", "claude", "yi", 
            "deepseek", "mistral", "openhermes"
        ]
        
        model_lower = model_id.lower()
        return any(rm.lower() in model_lower for rm in reasoning_models)

    async def get_model_info(self, model_id: str) -> ModelDetail:
        """
        Get detailed information about a specific Ollama model
        
        Args:
            model_id: The model ID
            
        Returns:
            ModelDetail object with model information
            
        Raises:
            ModelServiceError: If fetching model info fails
        """
        try:
            # Check cache first
            if model_id in self.model_info_cache:
                cache_entry = self.model_info_cache[model_id]
                # Check if cache is still valid
                if time.time() - cache_entry.get('timestamp', 0) < self.cache_ttl:
                    self.logger.debug(f"Using cached model info for {model_id}")
                    return cache_entry.get('data')
            
            # Get model metadata
            metadata = await self._get_model_metadata(model_id)
            
            # Get context length
            context_length = await self._get_model_context_length(model_id)
            
            # Determine capabilities
            capabilities = ["text-generation", "chat"]
            
            # Check if it's a reasoning model
            has_reasoning = self._check_model_reasoning_capability(model_id)
            if has_reasoning:
                capabilities.append("reasoning")
            
            # Extract parameters that can be used
            parameters = {
                "temperature": 0.7,
                "max_tokens": 1024,
                "top_p": 0.9,
                "frequency_penalty": 0.0,
                "presence_penalty": 0.0
            }
            
            # Create model detail
            model_detail = ModelDetail(
                id=model_id,
                name=model_id.split(":")[0].capitalize(),
                provider="ollama",
                description=f"Ollama model: {model_id}",
                parameters=parameters,
                context_length=context_length,
                capabilities=capabilities,
                has_reasoning=has_reasoning
            )
            
            # Cache the result
            self.model_info_cache[model_id] = {
                'data': model_detail,
                'timestamp': time.time()
            }
            
            self.logger.info(f"Retrieved info for Ollama model: {model_id} (context: {context_length})")
            return model_detail
            
        except Exception as e:
            self.log_error(model_id, e)
            raise ModelServiceError(f"Error fetching model info from Ollama: {str(e)}")

    async def generate_text(
        self, 
        model_id: str, 
        prompt: str, 
        temperature: float = 0.7, 
        max_tokens: int = 1024
    ) -> str:
        """
        Generate text from Ollama (non-streaming)
        
        Args:
            model_id: Ollama model ID (e.g., 'llama2', 'mistral')
            prompt: Input text prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            
        Returns:
            Generated text response
            
        Raises:
            ModelServiceError: If generation fails
        """
        # Clean model_id to remove provider prefix if present
        model_id = self.get_model_id_from_full_id(model_id)
        
        # Prepare request parameters
        params = {
            "model": model_id,
            "prompt": prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        
        # Log request details
        self.log_request(model_id, prompt, params)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/api/generate", json=params) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise ModelServiceError(
                            f"Ollama API error: {response.status} - {error_text}"
                        )
                    
                    result = await response.json()
                    generated_text = result.get('response', '')
                    
                    # Log response
                    self.log_response(model_id, generated_text)
                    
                    return generated_text
                    
        except aiohttp.ClientError as e:
            self.log_error(model_id, e)
            raise ModelServiceError(f"Ollama connection error: {str(e)}")
        except Exception as e:
            self.log_error(model_id, e)
            raise ModelServiceError(f"Ollama service error: {str(e)}")

    async def generate_stream(
        self, 
        model_id: str, 
        prompt: str, 
        temperature: float = 0.7, 
        max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming text from Ollama
        
        Args:
            model_id: Ollama model ID (e.g., 'llama2', 'mistral')
            prompt: Input text prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            
        Yields:
            Text chunks as they are generated
            
        Raises:
            ModelServiceError: If streaming generation fails
        """
        # Clean model_id to remove provider prefix if present
        model_id = self.get_model_id_from_full_id(model_id)
        
        # Prepare request parameters
        params = {
            "model": model_id,
            "prompt": prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }
        
        # Log request details
        self.log_request(model_id, prompt, params)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/api/generate", json=params) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise ModelServiceError(
                            f"Ollama streaming API error: {response.status} - {error_text}"
                        )
                    
                    # Process the streaming response
                    response_text = ""
                    async for line in response.content:
                        if not line:
                            continue
                        
                        try:
                            line_text = line.decode('utf-8').strip()
                            if not line_text:
                                continue
                                
                            data = json.loads(line_text)
                            if "response" in data:
                                chunk = data["response"]
                                response_text += chunk
                                yield chunk
                                
                            # Check if this is the last message
                            if data.get("done", False):
                                break
                                
                        except json.JSONDecodeError:
                            self.logger.warning(f"Failed to parse JSON from stream: {line_text}")
                            continue
                    
                    # Log final response (only for debugging since it may be very long)
                    self.logger.debug(f"Completed streaming response for {model_id}")
                    
        except aiohttp.ClientError as e:
            self.log_error(model_id, e)
            raise ModelServiceError(f"Ollama streaming connection error: {str(e)}")
        except Exception as e:
            self.log_error(model_id, e)
            raise ModelServiceError(f"Ollama streaming service error: {str(e)}")

    async def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Get a list of available Ollama models with metadata
        
        Returns:
            List of model information dictionaries
            
        Raises:
            ModelServiceError: If fetching models fails
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/tags") as response:
                    if response.status != 200:
                        error_text = await response.text()
                        self.logger.error(f"Ollama models API error: {response.status} - {error_text}")
                        return []
                    
                    # Parse JSON response
                    try:
                        result = await response.json()
                    except Exception as json_error:
                        self.logger.error(f"Error parsing Ollama API response: {str(json_error)}")
                        return []
                    
                    # Validate response structure
                    if not isinstance(result, dict):
                        self.logger.error(f"Unexpected response format from Ollama API: {type(result)}")
                        return []
                    
                    models_data = result.get('models', [])
                    if not isinstance(models_data, list):
                        self.logger.error(f"Unexpected 'models' format in Ollama API response: {type(models_data)}")
                        return []
                    
                    # Transform to our standard model format
                    models = []
                    for model in models_data:
                        if not isinstance(model, dict):
                            self.logger.warning(f"Skipping invalid model entry: {model}")
                            continue
                            
                        model_name = model.get('name', '')
                        if not model_name:
                            self.logger.warning("Skipping model with empty name")
                            continue
                        
                        try:
                            # Get context length (will use cache if available)
                            context_length = await self._get_model_context_length(model_name)
                            has_reasoning = self._check_model_reasoning_capability(model_name)
                            
                            models.append({
                                "id": f"ollama/{model_name}",
                                "name": model_name.capitalize(),
                                "provider": "ollama",
                                "description": f"Ollama model: {model_name}",
                                "context_length": context_length,
                                "has_reasoning": has_reasoning,
                                "parameters": {
                                    "temperature": 0.7,
                                    "max_tokens": min(1024, context_length // 4)  # Limit max_tokens
                                }
                            })
                        except Exception as model_error:
                            self.logger.warning(f"Error processing model {model_name}: {str(model_error)}")
                            continue
                    
                    self.logger.info(f"Found {len(models)} available Ollama models")
                    return models
                    
        except aiohttp.ClientError as e:
            self.logger.error(f"Ollama connection error fetching models: {str(e)}")
            # Return empty list rather than fail - fallback to default models
            return []
        except Exception as e:
            self.logger.error(f"Ollama service error fetching models: {str(e)}")
            # Return empty list as fallback
            return []