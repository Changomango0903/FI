from app.config import settings
from app.models.schema import ModelInfo, ModelDetail
import aiohttp
import logging

logger = logging.getLogger(__name__)

class HuggingFaceService:
    """Service for interacting with HuggingFace models"""
    
    def __init__(self):
        self.api_token = settings.HF_API_TOKEN
        self.api_url = "https://api-inference.huggingface.co/models"
        self.headers = {"Authorization": f"Bearer {self.api_token}"} if self.api_token else {}

    async def list_models(self) -> list[ModelInfo]:
        """List available models from HuggingFace (limited to popular ones)"""
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
        return popular_models

    async def get_model_info(self, model_id: str) -> ModelDetail:
        """Get detailed information about a specific model"""
        async with aiohttp.ClientSession() as session:
            try:
                # If this was a production app, we'd use the HF API to get real info
                # For now, we'll return some placeholder info
                return ModelDetail(
                    id=model_id,
                    name=model_id.split("/")[-1],
                    provider="huggingface",
                    description=f"HuggingFace model: {model_id}",
                    parameters=None,
                    context_length=2048,
                    capabilities=["text-generation"]
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