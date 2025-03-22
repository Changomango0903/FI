# Components Directory

This directory contains all the React components used in the application, organized by functional areas.

## Directory Structure

```
components/
├── chat/            # Chat-related components
├── common/          # Reusable UI components
├── layout/          # Layout components like Sidebar
├── project/         # Project-related components
├── settings/        # Settings components
├── index.js         # Component exports
└── README.md        # This file
```

## Component Organization

### Chat Components

Located in the `chat/` directory:
- `ChatWindow.jsx` - Main chat interface
- `Message.jsx` - Individual chat message
- `MessageInput.jsx` - Chat input field
- `Thinking.jsx` - Thinking/loading indicator
- `ContextWindow.jsx` - Context window visualizer

### Common Components

Located in the `common/` directory:
- `AlertDialog.jsx` - Confirmation dialogs
- `Button.jsx` - Reusable button component
- `ModelSelector.jsx` - Model selection component
- `ThemeToggle.jsx` - Theme switcher

### Layout Components

Located in the `layout/` directory:
- `Sidebar.jsx` - Application sidebar

### Project Components

Located in the `project/` directory:
- `ProjectHeader.jsx` - Project header
- `ProjectList.jsx` - List of projects
- `ProjectPage.jsx` - Project detail page
- `ProjectSettings.jsx` - Project settings
- `ProjectSelector.jsx` - Project selection dropdown
- `NewProjectModal.jsx` - New project creation dialog

### Settings Components

Located in the `settings/` directory:
- `Settings.jsx` - Settings form
- `SettingsPage.jsx` - Settings page layout

## Guidelines

1. **Component Structure**:
   - Each component should have PropTypes defined
   - Use named exports for sub-components, default export for the main component

2. **File Naming**:
   - Use PascalCase for component files (e.g., `Button.jsx`)
   - Use index.js files for directory exports

3. **Component Patterns**:
   - Extract complex logic to custom hooks
   - Use composition over inheritance
   - Keep components focused on a single responsibility

4. **Styling**:
   - Follow BEM naming convention for CSS classes
   - Component-specific styles should use the component name as prefix

5. **Performance**:
   - Memoize callbacks with useCallback when passed as props
   - Memoize expensive calculations with useMemo
   - Use React.memo for pure components when necessary 