# FI - Your Fast Intelligence Companion

<div align="center">
  <img src="frontend/public/logo.svg" alt="FI Logo" width="120" />
  <h3>A minimal, fast and robust chat interface for LLMs</h3>
</div>

## Overview

FI is a lightweight chat application designed to provide a seamless interface for interacting with various Large Language Models from HuggingFace and Ollama. Built with a clean, Apple-inspired design philosophy, FI focuses on simplicity while maintaining expandability for future features.

## Features

- **Multiple Model Providers**: Connect to both Ollama and HuggingFace models
- **Simple Chat Interface**: Clean, distraction-free chat experience
- **Real-time Streaming**: See responses as they're generated
- **Multi-chat Management**: Create and organize multiple conversations
- **Responsive Design**: Works well on both desktop and mobile devices
- **Model Information**: Clear display of which model you're using and its parameters
- **Expandable Architecture**: Designed for future RAG and agentic capabilities

## Screenshots

![Welcome Screen](docs/images/welcome-screen.png)
![Chat Interface](docs/images/chat-interface.png)
![Mobile View](docs/images/mobile-view.png)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+) for the frontend
- [Python](https://python.org/) (v3.9+) for the backend
- [Ollama](https://ollama.ai/) for local model hosting (optional)
- [Docker](https://www.docker.com/) and Docker Compose (optional)
- HuggingFace API token (optional)

### Installation

#### Using Docker (Recommended)

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/fi-chat.git
   cd fi-chat
   ```

2. Create a `.env` file in the root directory
   ```
   HF_API_TOKEN=your_huggingface_token  # Optional
   OLLAMA_BASE_URL=http://ollama:11434  # Change if needed
   ```

3. Build and start the containers
   ```bash
   docker-compose up -d
   ```

4. Access the application at http://localhost:5173

#### Manual Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/fi-chat.git
   cd fi-chat
   ```

2. Set up the backend
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Set environment variables
   export HF_API_TOKEN=your_huggingface_token  # Optional
   export OLLAMA_BASE_URL=http://localhost:11434  # Change if needed
   
   # Start the backend
   uvicorn app.main:app --reload
   ```

3. Set up the frontend
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Access the application at http://localhost:5173

## Architecture

FI is built with a clean separation between frontend and backend:

### Backend

- **FastAPI**: High-performance API with async support
- **Pydantic**: Type validation and data serialization
- **WebSockets**: Real-time streaming of model responses
- **Service Layer**: Abstractions for different LLM providers

### Frontend

- **React**: Component-based UI library
- **Context API**: Application state management
- **WebSockets**: Real-time communication with backend
- **CSS Variables**: Consistent theming and styling

## Project Structure

```
fi-chat/
├── backend/               # Python FastAPI backend
│   ├── app/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # LLM provider services
│   │   └── models/        # Pydantic schemas
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── context/       # React Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   └── services/      # API communication
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml     # Docker configuration
└── README.md
```

## Model Support

### Ollama Models

FI can connect to any model available in your local Ollama installation, including:
- Llama 2
- Mistral
- Vicuna
- And more...

### HuggingFace Models

With a HuggingFace API token, FI can connect to various models hosted on HuggingFace, including:
- GPT-2
- BART
- GPT-Neo
- And more...

## Future Roadmap

- [ ] **RAG Capabilities**: Connect to document databases for retrieval-augmented generation
- [ ] **Agentic Features**: Tool use, web browsing, and multi-step reasoning
- [ ] **Local File Analysis**: Upload and analyze documents
- [ ] **Custom Fine-tuning**: Tune models on your data
- [ ] **Dark Mode**: Complete theme support
- [ ] **Export/Import**: Save and share your conversations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend library
- [Ollama](https://ollama.ai/) for local model support
- [HuggingFace](https://huggingface.co/) for hosted models