# app/services/library_service.py

import asyncio
import aiohttp
import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from bs4 import BeautifulSoup
import json
from app.config import settings

# Configure logger for this module
logger = logging.getLogger(__name__)

class LibraryService:
    """Service for interacting with the Ollama library and model installation.
    
    Provides methods to scrape model information from the Ollama library website
    and install models that are not yet available locally.
    """
    
    def __init__(self):
        """Initialize the Library service with configuration."""
        self.base_url = settings.OLLAMA_BASE_URL
        self.library_url = "https://ollama.com/library"
        logger.info(f"Initialized Library service with base URL: {self.base_url}")
    
    async def scrape_library(self) -> List[Dict[str, Any]]:
        """Scrape model information from the Ollama library website.
        
        Returns:
            A list of dictionaries containing model information
            
        Raises:
            Exception: If scraping fails
        """
        async with aiohttp.ClientSession() as session:
            try:
                logger.info(f"Scraping Ollama library from {self.library_url}")
                
                # Fetch the library page HTML
                async with session.get(self.library_url, timeout=10) as response:
                    if response.status != 200:
                        logger.error(f"Failed to fetch Ollama library: {response.status}")
                        return []
                    
                    html_content = await response.text()
                
                # Parse the HTML to extract model information
                models = await self._parse_library_html(html_content)
                logger.info(f"Scraped {len(models)} models from Ollama library")
                
                return models
            
            except aiohttp.ClientError as e:
                logger.error(f"Connection error scraping Ollama library: {str(e)}")
                return []
            except Exception as e:
                logger.error(f"Error scraping Ollama library: {str(e)}", exc_info=True)
                return []
    
    async def _parse_library_html(self, html_content: str) -> List[Dict[str, Any]]:
        """Parse HTML from the Ollama library to extract model information.
        
        Args:
            html_content: HTML content from the Ollama library page
            
        Returns:
            List of dictionaries containing model information
        """
        models = []
        try:
            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Find all model cards (adjust selector based on actual website structure)
            model_cards = soup.select('.model-card, .library-item, article')
            
            for card in model_cards:
                try:
                    # Extract model information (adjust based on actual HTML structure)
                    model_id = card.select_one('.model-id, h2, h3').text.strip()
                    description_elem = card.select_one('.model-description, p')
                    description = description_elem.text.strip() if description_elem else ""
                    
                    # Extract parameter size and other metadata
                    parameter_size = None
                    parameter_size_elem = card.select_one('.parameter-size, .model-size')
                    if parameter_size_elem:
                        size_text = parameter_size_elem.text.strip()
                        # Extract digit and B/M indicator (e.g., "7B", "13B", "70B", "430M")
                        size_match = re.search(r'(\d+(?:\.\d+)?)\s*([BM])', size_text, re.IGNORECASE)
                        if size_match:
                            value, unit = size_match.groups()
                            if unit.upper() == 'B':
                                parameter_size = float(value)
                            elif unit.upper() == 'M':
                                parameter_size = float(value) / 1000  # Convert M to B
                    
                    # Extract model family
                    family = None
                    if ':' in model_id:
                        family = model_id.split(':')[0]
                    elif '-' in model_id:
                        family = model_id.split('-')[0]
                    
                    # Create model info dictionary
                    model_info = {
                        "id": model_id,
                        "name": self._format_model_name(model_id),
                        "provider": "ollama",
                        "description": description,
                        "parameter_size": parameter_size,
                        "family": family,
                        "installable": True
                    }
                    
                    models.append(model_info)
                
                except Exception as e:
                    logger.warning(f"Error parsing model card: {str(e)}")
                    continue
            
            # If we couldn't find models with the card selector, try an alternative approach
            if not models:
                # Alternative: look for model links and info in the page
                model_links = soup.select('a[href^="/library/"]')
                
                for link in model_links:
                    try:
                        model_id = link['href'].replace('/library/', '')
                        name_elem = link.select_one('h3, h4, strong')
                        name = name_elem.text.strip() if name_elem else self._format_model_name(model_id)
                        
                        description_elem = link.select_one('p, .description')
                        description = description_elem.text.strip() if description_elem else ""
                        
                        # Add the model
                        model_info = {
                            "id": model_id,
                            "name": name,
                            "provider": "ollama",
                            "description": description,
                            "installable": True
                        }
                        
                        models.append(model_info)
                    
                    except Exception as e:
                        logger.warning(f"Error parsing model link: {str(e)}")
                        continue
            
            # If the HTML parsing approach fails, fallback to pre-defined models
            if not models:
                logger.warning("HTML parsing failed, falling back to API approach")
                models = await self._fetch_models_from_api()
            
            return models
        
        except Exception as e:
            logger.error(f"Error parsing library HTML: {str(e)}", exc_info=True)
            # Fallback to API if HTML parsing fails
            return await self._fetch_models_from_api()
    
    async def _fetch_models_from_api(self) -> List[Dict[str, Any]]:
        """Fallback method to fetch models from the Ollama API registry.
        
        Returns:
            List of model dictionaries
        """
        # List of common models to provide as fallback
        common_models = [
            {"id": "llama3:latest", "name": "Llama 3", "family": "llama", "parameter_size": 8.0},
            {"id": "llama3.1:latest", "name": "Llama 3.1", "family": "llama", "parameter_size": 8.0},
            {"id": "llama3:8b", "name": "Llama 3 8B", "family": "llama", "parameter_size": 8.0},
            {"id": "llama3:70b", "name": "Llama 3 70B", "family": "llama", "parameter_size": 70.0},
            {"id": "mistral:latest", "name": "Mistral", "family": "mistral", "parameter_size": 7.0},
            {"id": "mistral:7b", "name": "Mistral 7B", "family": "mistral", "parameter_size": 7.0},
            {"id": "mixtral:8x7b", "name": "Mixtral 8x7B", "family": "mixtral", "parameter_size": 56.0},
            {"id": "phi3:latest", "name": "Phi-3", "family": "phi", "parameter_size": 3.8},
            {"id": "phi3:mini", "name": "Phi-3 Mini", "family": "phi", "parameter_size": 3.8},
            {"id": "phi3:medium", "name": "Phi-3 Medium", "family": "phi", "parameter_size": 14.0},
            {"id": "gemma:latest", "name": "Gemma", "family": "gemma", "parameter_size": 7.0},
            {"id": "gemma:2b", "name": "Gemma 2B", "family": "gemma", "parameter_size": 2.0},
            {"id": "gemma:7b", "name": "Gemma 7B", "family": "gemma", "parameter_size": 7.0},
            {"id": "codellama:latest", "name": "Code Llama", "family": "codellama", "parameter_size": 7.0},
            {"id": "codellama:7b", "name": "Code Llama 7B", "family": "codellama", "parameter_size": 7.0},
            {"id": "codellama:13b", "name": "Code Llama 13B", "family": "codellama", "parameter_size": 13.0},
            {"id": "codellama:34b", "name": "Code Llama 34B", "family": "codellama", "parameter_size": 34.0},
            {"id": "deepseek-coder:latest", "name": "DeepSeek Coder", "family": "deepseek", "parameter_size": 6.7}
        ]
        
        # Add description and installable flag to each model
        for model in common_models:
            model["provider"] = "ollama"
            model["description"] = f"{model['name']} model for text generation"
            model["installable"] = True
        
        return common_models
    
    def _format_model_name(self, model_id: str) -> str:
        """Format model ID into a human-readable name.
        
        Args:
            model_id: The ID of the model
            
        Returns:
            A formatted display name for the model
        """
        try:
            # Get base name and tag
            if ':' in model_id:
                base_name, tag = model_id.split(':', 1)
            else:
                base_name = model_id
                tag = None
            
            # Format the base name
            if '-' in base_name:
                # Handle names like "llama-2"
                parts = base_name.split('-')
                formatted_name = ' '.join(part.capitalize() for part in parts)
            else:
                # Handle alphanumeric model names like "llama3"
                import re
                # Split by numbers but keep them
                parts = re.findall(r'[A-Za-z]+|\d+', base_name)
                formatted_name = ' '.join(part.capitalize() for part in parts)
            
            # Add the tag if it's not "latest"
            if tag and tag != "latest":
                if tag.isdigit() or ('b' in tag.lower() and tag.lower().replace('b', '').isdigit()):
                    # It's a size tag like "7b"
                    formatted_name += f" {tag.upper()}"
                else:
                    # It's a variant tag
                    formatted_name += f" ({tag.capitalize()})"
            
            return formatted_name
        except Exception as e:
            logger.error(f"Error formatting model name: {str(e)}")
            # Fall back to simple capitalization
            return model_id.split(':')[0].capitalize()

    async def get_installed_models(self) -> List[str]:
        """Get a list of currently installed Ollama model IDs.
        
        Returns:
            A list of installed model IDs
        """
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{self.base_url}/api/tags", timeout=5) as response:
                    if response.status != 200:
                        logger.warning(f"Failed to fetch installed Ollama models: {response.status}")
                        return []
                    
                    data = await response.json()
                    installed_models = [model["name"] for model in data.get("models", [])]
                    logger.info(f"Found {len(installed_models)} installed models")
                    
                    return installed_models
            
            except Exception as e:
                logger.error(f"Error fetching installed models: {str(e)}")
                return []
    
    async def install_model(self, model_id: str) -> Tuple[bool, str]:
        """Install a model using Ollama pull command.
        
        Args:
            model_id: The ID of the model to install
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        async with aiohttp.ClientSession() as session:
            try:
                logger.info(f"Installing model: {model_id}")
                
                # Use Ollama pull API
                async with session.post(
                    f"{self.base_url}/api/pull",
                    json={"name": model_id},
                    timeout=30  # Longer timeout for model downloads
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Failed to install model {model_id}: {error_text}")
                        return False, f"Installation failed with status {response.status}: {error_text}"
                    
                    # Check for streaming response
                    content_type = response.headers.get('Content-Type', '')
                    if 'application/x-ndjson' in content_type:
                        # Process streaming response
                        progress_info = []
                        async for line in response.content:
                            if line:
                                try:
                                    data = json.loads(line)
                                    if "status" in data:
                                        progress_info.append(data["status"])
                                    
                                    # Log download progress occasionally
                                    if "completed" in data and "total" in data:
                                        if data["total"] > 0:
                                            progress = (data["completed"] / data["total"]) * 100
                                            if int(progress) % 10 == 0:  # Log every 10%
                                                logger.info(f"Model {model_id} download: {progress:.1f}%")
                                except json.JSONDecodeError:
                                    logger.warning(f"Couldn't parse progress line: {line}")
                        
                        # Check if installation completed successfully
                        if any("success" in info.lower() for info in progress_info):
                            logger.info(f"Model {model_id} installed successfully")
                            return True, "Installation completed successfully"
                        else:
                            logger.warning(f"Model {model_id} installation status unclear")
                            return True, "Installation completed, but status unclear"
                    else:
                        # Handle regular response
                        result = await response.json()
                        logger.info(f"Model {model_id} installation response: {result}")
                        return True, "Installation completed successfully"
            
            except aiohttp.ClientError as e:
                logger.error(f"Connection error installing model {model_id}: {str(e)}")
                return False, f"Connection error: {str(e)}"
            except asyncio.TimeoutError:
                logger.error(f"Timeout while installing model {model_id}")
                return False, "Installation timed out. The model may still be downloading in the background."
            except Exception as e:
                logger.error(f"Error installing model {model_id}: {str(e)}", exc_info=True)
                return False, f"Installation error: {str(e)}"
    
    async def get_model_details(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a model.
        
        Args:
            model_id: The ID of the model
            
        Returns:
            Dictionary with model details or None if not found
        """
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/api/show",
                    json={"name": model_id},
                    timeout=5
                ) as response:
                    if response.status != 200:
                        logger.warning(f"Failed to get details for model {model_id}: {response.status}")
                        return None
                    
                    model_data = await response.json()
                    
                    # Extract key metadata from the response
                    family = self._extract_model_family(model_id)
                    
                    # Extract parameter size from model_data or model_id
                    parameter_size = model_data.get("parameter_size")
                    if not parameter_size:
                        # Try extracting from model_id (e.g., llama3:7b -> 7)
                        size_match = re.search(r':(\d+)b', model_id, re.IGNORECASE)
                        if size_match:
                            parameter_size = float(size_match.group(1))
                    
                    # Extract context length
                    context_length = model_data.get("context_length", 4096)
                    
                    # Get model description
                    description = model_data.get("description", f"Ollama model: {model_id}")
                    
                    return {
                        "id": model_id,
                        "name": self._format_model_name(model_id),
                        "provider": "ollama",
                        "description": description,
                        "parameter_size": parameter_size,
                        "context_length": context_length,
                        "family": family,
                        "installed": True
                    }
            
            except Exception as e:
                logger.error(f"Error getting model details: {str(e)}")
                return None
    
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
            
            # Try to extract alphanumeric prefix
            match = re.match(r'^([a-zA-Z]+)', model_id)
            if match:
                return match.group(1).lower()
            
            # Just return the model ID if we can't parse it
            return model_id.lower()
        except Exception:
            return None