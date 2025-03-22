# Fast Intelligence Frontend

## Overview

Fast Intelligence is a modern web application for interacting with various AI models. The frontend provides a chat interface where users can select different AI models, manage projects, and configure model parameters.

## Project Structure

The application is built with React and follows a well-organized structure:

```
frontend/
├── public/              # Static assets and HTML template
├── src/
│   ├── assets/          # Images, icons, and other assets
│   ├── components/      # UI components
│   ├── context/         # React contexts for state management
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── styles/          # CSS files
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main application component
│   ├── config.js        # Application configuration
│   ├── index.jsx        # Entry point
│   └── main.jsx         # Root rendering logic
```

## Key Features

- **Custom Hooks**: Separate hooks for models, chats, settings, theme, etc.
- **Centralized Configuration**: Configuration values in one central location
- **Comprehensive Logging**: Detailed logging system with different log levels
- **Utility Functions**: Helper functions for common tasks
- **Context Providers**: Shared state using context API
- **API Services**: Organized API interaction

## Custom Hooks

The application uses several custom hooks for better separation of concerns:

- `useModels`: Manages model fetching and selection
- `useChat`: Handles chat messages and conversations
- `useSettings`: Controls model settings like temperature and tokens
- `useTheme`: Manages light/dark theme
- `useAPI`: Centralizes API calls
- `useProjects`: Manages user projects
- `useWindowResize`: Handles responsive design

## Utilities

Common functionality is extracted into utility modules:

- `models.js`: Model-related helper functions
- `localStorage.js`: Local storage operations
- `logger.js`: Application logging

## Context

The application uses React Context API for state management:

- `ModelContext`: Provides model and chat functionality
- `ThemeContext`: Manages application theme
- `ProjectContext`: Handles project management

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Setup vendor files:
   ```
   cd src/vendor
   ./install-vendor-files.sh
   cd ../..
   ```

3. Start development server:
   ```
   npm run dev
   ```

4. Build for production:
   ```
   npm run build
   ```

## Environment Variables

- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:8000/api) 