from app.config import settings
from app.models.schema import ModelInfo, ModelDetail
import aiohttp
import logging
import re

logger = logging.getLogger(__name__)

class HuggingFaceService:
    """Service for interacting with HuggingFace models with improved metadata"""
    
    def __init__(self):
        self.api_token = settings.HF_API_TOKEN
        self.api_url = "https://api-inference.huggingface.co/models"
        self.headers = {"Authorization": f"Bearer {self.api_token}"} if self.api_token else {}

    async def list_models(self) -> list[ModelInfo]:
        """List available models from HuggingFace (with enhanced metadata)"""
        # Define some popular models with metadata
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
        
        # Convert to ModelInfo objects
        return [ModelInfo(**model) for model in popular_models]

    async def get_model_info(self, model_id: str) -> ModelDetail:
        """Get detailed information about a specific model"""
        async with aiohttp.ClientSession() as session:
            try:
                # Extract model family and size from id
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
                
                # Determine capabilities based on model
                capabilities = ["text-generation"]
                if "bart" in model_id.lower() or "t5" in model_id.lower():
                    capabilities.append("summarization")
                if "gpt" in model_id.lower() or "bloom" in model_id.lower() or "llama" in model_id.lower():
                    capabilities.append("chat")
                if "code" in model_id.lower():
                    capabilities.append("code-generation")
                
                # Format the name nicely
                display_name = model_id.split("/")[-1].replace("-", " ").title()
                if parameter_size:
                    if float(parameter_size) < 1:
                        # Convert to millions for small models
                        m_size = round(float(parameter_size) * 1000)
                        display_name = f"{display_name} ({m_size}M)"
                    else:
                        display_name = f"{display_name} ({parameter_size}B)"
                
                return ModelDetail(
                    id=model_id,
                    name=display_name,
                    provider="huggingface",
                    description=f"HuggingFace model: {model_id}",
                    parameters={"parameter_size": parameter_size},
                    context_length=context_length,
                    capabilities=capabilities,
                    family=family,
                    parameter_size=parameter_size
                )
            except Exception as e:
                logger.error(f"Error fetching model info from HuggingFace: {str(e)}")
                raise
    
    async def generate_text(self, model_id: str, prompt: str, params: dict) -> str:
        """Generate text using a HuggingFace model"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.api_url}/{model_id}",
                    headers=self.headers,
                    json={"inputs": prompt, "parameters": params}
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"HuggingFace API error: {error_text}")
                    
                    result = await response.json()
                    if isinstance(result, list) and len(result) > 0:
                        return result[0].get("generated_text", "")
                    return str(result)
            except Exception as e:
                logger.error(f"Error generating text with HuggingFace: {str(e)}")
                raise

    async def generate_stream(self, model_id: str, prompt: str, params: dict):
        """Stream text generation using a HuggingFace model"""
        # Note: Not all HF models support streaming, so this is a placeholder
        # In a real app, you'd implement proper streaming with the HF API
        text = await self.generate_text(model_id, prompt, params)
        # Simulate streaming by yielding each token
        for char in text:
            yield char