# app/services/hf_service.py

import asyncio
from app.config import settings
from app.models.schema import ModelInfo, ModelDetail
import aiohttp
import logging
import re
from typing import List, Dict, Any, AsyncGenerator, Optional

# Configure logger for this module
logger = logging.getLogger(__name__)

class HuggingFaceService:
    """Service for interacting with HuggingFace models with improved metadata.
    
    Provides methods to interact with HuggingFace hosted models.
    """
    
    def __init__(self):
        """Initialize the HuggingFace service with configuration."""
        self.api_token = settings.HF_API_TOKEN
        self.api_url = "https://api-inference.huggingface.co/models"
        self.headers = {"Authorization": f"Bearer {self.api_token}"} if self.api_token else {}
        
        if not self.api_token:
            logger.warning("HuggingFace API token not provided - API calls may be rate limited")

    async def list_models(self) -> List[ModelInfo]:
        """List available models from HuggingFace (with enhanced metadata).
        
        Returns:
            A list of ModelInfo objects representing available models
        """
        # Define some popular models with metadata
        # This is a curated list since we can't easily query all HF models
        popular_models = [
            {
                "id": "gpt2",
                "name": "GPT-2",
                "provider": "huggingface",
                "description": "OpenAI's GPT-2 model",
                "family": "gpt",
                "parameter_size": "124"  # 124M parameters
            },
            {
                "id": "facebook/bart-large-cnn",
                "name": "BART Large CNN",
                "provider": "huggingface",
                "description": "Facebook's BART model fine-tuned on CNN Daily Mail",
                "family": "bart",
                "parameter_size": "400"  # ~400M parameters
            },
            {
                "id": "EleutherAI/gpt-neo-1.3B",
                "name": "GPT-Neo 1.3B",
                "provider": "huggingface",
                "description": "EleutherAI's GPT-Neo model",
                "family": "gpt-neo",
                "parameter_size": "1.3"
            },
            {
                "id": "EleutherAI/gpt-neo-2.7B",
                "name": "GPT-Neo 2.7B",
                "provider": "huggingface",
                "description": "EleutherAI's larger GPT-Neo model",
                "family": "gpt-neo",
                "parameter_size": "2.7"
            },
            {
                "id": "EleutherAI/gpt-j-6B",
                "name": "GPT-J 6B",
                "provider": "huggingface",
                "description": "EleutherAI's GPT-J model",
                "family": "gpt-j",
                "parameter_size": "6"
            },
            {
                "id": "bigscience/bloom-560m",
                "name": "BLOOM 560M",
                "provider": "huggingface",
                "description": "BigScience BLOOM model (small)",
                "family": "bloom",
                "parameter_size": "0.56"
            },
            {
                "id": "bigscience/bloom-1b7",
                "name": "BLOOM 1.7B",
                "provider": "huggingface",
                "description": "BigScience BLOOM model (medium)",
                "family": "bloom",
                "parameter_size": "1.7"
            },
            {
                "id": "bigscience/bloom",
                "name": "BLOOM 176B",
                "provider": "huggingface",
                "description": "BigScience BLOOM model (full size)",
                "family": "bloom",
                "parameter_size": "176"
            },
            {
                "id": "microsoft/phi-2",
                "name": "Phi-2 2.7B",
                "provider": "huggingface",
                "description": "Microsoft's Phi-2 small language model",
                "family": "phi",
                "parameter_size": "2.7"
            },
            {
                "id": "HuggingFaceH4/zephyr-7b-beta",
                "name": "Zephyr 7B",
                "provider": "huggingface",
                "description": "HuggingFace Zephyr model",
                "family": "zephyr",
                "parameter_size": "7"
            }
        ]
        
        # Convert to ModelInfo objects with metadata
        model_infos = []
        for model_data in popular_models:
            # Extract metadata fields from model_data
            metadata_fields = {
                "family": model_data.get("family"),
                "parameter_size": model_data.get("parameter_size")
            }
            
            # Remove metadata fields from the main model data
            model_dict = {k: v for k, v in model_data.items() 
                         if k not in ["family", "parameter_size"]}
            
            # Create ModelInfo with metadata
            model_info = ModelInfo(
                **model_dict,
                metadata={k: v for k, v in metadata_fields.items() if v is not None}
            )
            model_infos.append(model_info)
            
        logger.info(f"Returning {len(model_infos)} curated HuggingFace models")
        return model_infos

    async def get_model_info(self, model_id: str) -> ModelDetail:
        """Get detailed information about a specific model.
        
        Args:
            model_id: The ID of the model to get information for
            
        Returns:
            Detailed model information
            
        Raises:
            Exception: If model information cannot be retrieved
        """
        async with aiohttp.ClientSession() as session:
            try:
                # Extract model family and size from id
                family, parameter_size, context_length = self._extract_model_metadata(model_id)
                
                # Determine capabilities based on model
                capabilities = self._determine_model_capabilities(model_id)
                
                # Format the name nicely
                display_name = self._format_model_name(model_id, parameter_size)
                
                # Create ModelDetail instance with metadata
                metadata = {
                    "family": family,
                    "parameter_size": parameter_size,
                    "context_length": context_length
                }
                
                return ModelDetail(
                    id=model_id,
                    name=display_name,
                    provider="huggingface",
                    description=f"HuggingFace model: {model_id}",
                    parameters={"parameter_size": parameter_size},
                    context_length=context_length,
                    capabilities=capabilities,
                    metadata=metadata
                )
            except Exception as e:
                logger.error(f"Error fetching model info from HuggingFace: {str(e)}", exc_info=True)
                raise
    
    def _extract_model_metadata(self, model_id: str) -> tuple[Optional[str], Optional[str], int]:
        """Extract model family, size, and context length from model ID.
        
        Args:
            model_id: The ID of the model
        
        Returns:
            Tuple of (family, parameter_size, context_length)
        """
        # Extract model family from ID
        family = model_id.split("/")[-1].split("-")[0].lower()
        
        # Try to identify parameter size from the model ID
        size_pattern = r'(\d+\.?\d*)b'  # e.g., 7b, 1.3b
        size_match = re.search(size_pattern, model_id.lower())
        parameter_size = size_match.group(1) if size_match else None
        
        if not parameter_size:
            # Alternative patterns like "bloom-560m" or specific known models
            size_pattern = r'(\d+)m'  # e.g., 560m
            size_match = re.search(size_pattern, model_id.lower())
            if size_match:
                # Convert to billions for consistency
                m_size = float(size_match.group(1))
                parameter_size = str(m_size / 1000)  # Convert to billions
            elif "gpt2" in model_id.lower():
                parameter_size = "0.124"  # 124M
            elif "distilbert" in model_id.lower():
                parameter_size = "0.066"  # 66M
        
        # Determine context length based on model family
        context_length = 2048  # Default
        if "gpt-j" in model_id.lower():
            context_length = 2048
        elif "bloom" in model_id.lower():
            context_length = 2048
        elif "gpt-neo" in model_id.lower():
            context_length = 2048
        elif "bart" in model_id.lower():
            context_length = 1024
        elif "t5" in model_id.lower():
            context_length = 512
        
        return family, parameter_size, context_length
        
    def _determine_model_capabilities(self, model_id: str) -> List[str]:
        """Determine model capabilities based on model ID.
        
        Args:
            model_id: The ID of the model
            
        Returns:
            List of capability strings
        """
        # Determine capabilities based on model
        capabilities = ["text-generation"]
        
        if "bart" in model_id.lower() or "t5" in model_id.lower():
            capabilities.append("summarization")
            
        if "gpt" in model_id.lower() or "bloom" in model_id.lower() or "llama" in model_id.lower():
            capabilities.append("chat")
            
        if "code" in model_id.lower():
            capabilities.append("code-generation")
            
        return capabilities
        
    def _format_model_name(self, model_id: str, parameter_size: Optional[str] = None) -> str:
        """Format model ID into a human-readable name.
        
        Args:
            model_id: The ID of the model
            parameter_size: Optional parameter size to include in the name
            
        Returns:
            A formatted display name for the model
        """
        # Extract the model name without organization prefix
        if "/" in model_id:
            model_name = model_id.split("/")[-1]
        else:
            model_name = model_id
            
        # Format the name
        display_name = model_name.replace("-", " ").title()
        
        # Add parameter size if available
        if parameter_size:
            if float(parameter_size) < 1:
                # Convert to millions for small models
                m_size = round(float(parameter_size) * 1000)
                display_name = f"{display_name} ({m_size}M)"
            else:
                display_name = f"{display_name} ({parameter_size}B)"
                
        return display_name
    
    async def generate_text(self, model_id: str, prompt: str, params: Dict[str, Any]) -> str:
        """Generate text using a HuggingFace model.
        
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
                # Map our parameters to HuggingFace parameters
                hf_params = {
                    "inputs": prompt,
                    "parameters": {
                        "temperature": params.get("temperature", 0.7),
                        "max_new_tokens": params.get("max_tokens", 1024),
                        "return_full_text": False
                    }
                }
                
                logger.debug(f"Sending generation request to HuggingFace for model {model_id}")
                
                async with session.post(
                    f"{self.api_url}/{model_id}",
                    headers=self.headers,
                    json=hf_params,
                    timeout=30  # Longer timeout for generation
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"HuggingFace API error: {error_text}")
                    
                    result = await response.json()
                    
                    # Handle different response formats
                    if isinstance(result, list) and len(result) > 0:
                        # Most common response format from HuggingFace
                        return result[0].get("generated_text", "")
                    elif isinstance(result, dict) and "generated_text" in result:
                        # Alternative format
                        return result["generated_text"]
                    else:
                        # Fall back to returning the whole result as a string
                        return str(result)
            except aiohttp.ClientError as e:
                logger.error(f"Connection error generating text with HuggingFace: {str(e)}")
                raise Exception(f"Connection error: {str(e)}")
            except Exception as e:
                logger.error(f"Error generating text with HuggingFace: {str(e)}", exc_info=True)
                raise

    async def generate_stream(self, model_id: str, prompt: str, params: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """Stream text generation using a HuggingFace model.
        
        Args:
            model_id: The ID of the model to use
            prompt: The prompt text to send to the model
            params: Generation parameters
            
        Yields:
            Tokens of the generated response as they become available
            
        Note:
            Not all HuggingFace models support streaming - this simulates streaming
        """
        # Note: This is a simulation of streaming since not all HF models support it
        logger.warning(f"Streaming not directly supported for HuggingFace model {model_id} - simulating stream")
        
        try:
            # Generate the full response
            full_text = await self.generate_text(model_id, prompt, params)
            
            # Simulate streaming by yielding each character
            # In a production environment, you would use the actual streaming API when available
            for char in full_text:
                yield char
                # Add a very short delay to simulate token-by-token generation
                await asyncio.sleep(0.01)
                
        except Exception as e:
            logger.error(f"Error in simulated HuggingFace stream: {str(e)}", exc_info=True)
            raise