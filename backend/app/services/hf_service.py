from app.config import settings
from app.models.schema import ModelInfo, ModelDetail
import aiohttp
import json
from typing import List, Dict, Any, AsyncGenerator, Optional
from app.services.base_service import BaseModelService
from app.utils.exceptions import ModelServiceError, ModelNotFoundError

class HuggingFaceService(BaseModelService):
    """Service for interacting with HuggingFace models"""
    
    def __init__(self):
        """Initialize the HuggingFace service with API token from settings"""
        super().__init__()
        self.api_token = settings.HF_API_TOKEN
        self.api_url = "https://api-inference.huggingface.co/models"
        self.headers = {"Authorization": f"Bearer {self.api_token}"} if self.api_token else {}

    async def list_models(self) -> list[ModelInfo]:
        """List available models from HuggingFace (limited to popular ones)"""
        try:
            # In a real app, you might want to query the HF API 
            # For simplicity, we'll return a small predefined list
            popular_models = [
                ModelInfo(
                    id="gpt2",
                    name="GPT-2",
                    provider="huggingface",
                    description="OpenAI's GPT-2 model"
                ),
                ModelInfo(
                    id="facebook/bart-large-cnn",
                    name="BART Large CNN",
                    provider="huggingface",
                    description="Facebook's BART model fine-tuned on CNN Daily Mail"
                ),
                ModelInfo(
                    id="EleutherAI/gpt-neo-1.3B",
                    name="GPT-Neo 1.3B",
                    provider="huggingface",
                    description="EleutherAI's GPT-Neo model"
                )
            ]
            self.logger.info(f"Returning {len(popular_models)} popular HuggingFace models")
            return popular_models
        except Exception as e:
            self.logger.error(f"Error fetching HuggingFace models: {str(e)}")
            return []

    async def get_model_info(self, model_id: str) -> ModelDetail:
        """
        Get detailed information about a specific HuggingFace model
        
        Args:
            model_id: HuggingFace model identifier
            
        Returns:
            Detailed model information
            
        Raises:
            ModelNotFoundError: If the model is not found
            ModelServiceError: For other service errors
        """
        try:
            # If this was a production app, we'd use the HF API to get real info
            # For now, we'll return some placeholder info
            model_detail = ModelDetail(
                id=model_id,
                name=model_id.split("/")[-1],
                provider="huggingface",
                description=f"HuggingFace model: {model_id}",
                parameters=None,
                context_length=2048,
                capabilities=["text-generation"]
            )
            
            self.logger.info(f"Retrieved info for HuggingFace model: {model_id}")
            return model_detail
        except Exception as e:
            self.log_error(model_id, e)
            raise ModelServiceError(f"Error fetching model info from HuggingFace: {str(e)}")
    
    async def generate_text(
        self, 
        model_id: str, 
        prompt: str, 
        temperature: float = 0.7, 
        max_tokens: int = 1024
    ) -> str:
        """
        Generate text from a HuggingFace model (non-streaming)
        
        Args:
            model_id: HuggingFace model ID
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
            "temperature": temperature,
            "max_length": max_tokens,
            "return_full_text": False
        }
        
        # Log request details
        self.log_request(model_id, prompt, params)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_url}/{model_id}",
                    headers=self.headers,
                    json={"inputs": prompt, "parameters": params}
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise ModelServiceError(
                            f"HuggingFace API error: {response.status} - {error_text}"
                        )
                    
                    result = await response.json()
                    
                    # Extract the generated text based on the response format
                    if isinstance(result, list) and len(result) > 0:
                        generated_text = result[0].get("generated_text", "")
                    else:
                        generated_text = str(result)
                    
                    # Log response
                    self.log_response(model_id, generated_text)
                    
                    return generated_text
                    
        except aiohttp.ClientError as e:
            self.log_error(model_id, e)
            raise ModelServiceError(f"HuggingFace connection error: {str(e)}")
        except Exception as e:
            self.log_error(model_id, e)
            raise ModelServiceError(f"HuggingFace service error: {str(e)}")

    async def generate_stream(
        self, 
        model_id: str, 
        prompt: str, 
        temperature: float = 0.7, 
        max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming text from a HuggingFace model
        
        Args:
            model_id: HuggingFace model ID
            prompt: Input text prompt
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            
        Yields:
            Text chunks as they are generated
            
        Raises:
            ModelServiceError: If streaming generation fails
            
        Note:
            Not all HF models support true streaming. This implementation 
            simulates streaming by yielding characters from a completed generation.
        """
        # Clean model_id to remove provider prefix if present
        model_id = self.get_model_id_from_full_id(model_id)
        
        # Log request details
        params = {
            "temperature": temperature,
            "max_length": max_tokens,
            "return_full_text": False
        }
        self.log_request(model_id, prompt, params)
        
        try:
            # Get the complete text first (since true streaming isn't available for all models)
            text = await self.generate_text(model_id, prompt, temperature, max_tokens)
            
            # Simulate streaming by yielding each character
            # In a production app, you'd implement proper streaming with the HF API
            # for models that support it
            self.logger.info(f"Simulating streaming for {model_id} ({len(text)} characters)")
            
            # Yield characters with a small delay to simulate streaming
            for char in text:
                yield char
            
            self.logger.debug(f"Completed simulated streaming for {model_id}")
            
        except Exception as e:
            self.log_error(model_id, e)
            raise ModelServiceError(f"HuggingFace streaming error: {str(e)}")
            
    async def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Get a list of available HuggingFace models
        
        Returns:
            List of model information dictionaries
        """
        try:
            # This would typically query the HF API, but for simplicity we return a static list
            models = [
                {
                    "id": "huggingface/gpt2",
                    "name": "GPT-2",
                    "provider": "huggingface",
                    "description": "OpenAI's GPT-2 model",
                    "parameters": {
                        "temperature": 0.7,
                        "max_tokens": 1024
                    }
                },
                {
                    "id": "huggingface/facebook/bart-large-cnn",
                    "name": "BART Large CNN",
                    "provider": "huggingface",
                    "description": "Facebook's BART model fine-tuned on CNN Daily Mail",
                    "parameters": {
                        "temperature": 0.7,
                        "max_tokens": 512
                    }
                },
                {
                    "id": "huggingface/EleutherAI/gpt-neo-1.3B",
                    "name": "GPT-Neo 1.3B",
                    "provider": "huggingface",
                    "description": "EleutherAI's GPT-Neo model",
                    "parameters": {
                        "temperature": 0.7,
                        "max_tokens": 1024
                    }
                }
            ]
            
            self.logger.info(f"Returning {len(models)} available HuggingFace models")
            return models
            
        except Exception as e:
            self.logger.error(f"Error fetching available HuggingFace models: {str(e)}")
            # Return empty list as fallback
            return []