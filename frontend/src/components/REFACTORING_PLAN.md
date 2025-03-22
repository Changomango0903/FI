# Component Refactoring Plan

This document outlines the plan for refactoring the components in the Fast Intelligence application to improve organization, maintainability, and code quality.

## Directory Structure

```
src/
├── components/
│   ├── ui/           # Generic UI components 
│   ├── chat/         # Chat-related components
│   ├── layout/       # Layout components
│   ├── project/      # Project-related components
│   ├── model/        # Model-related components
│   ├── error/        # Error handling components
│   └── index.js      # Barrel file for component exports
├── context/          # Context providers and hooks
├── utils/            # Utility functions
├── hooks/            # Custom hooks
└── App.jsx           # Main application component
```

## Components Status

### Common Components
- [x] Button (ui/Button.jsx)
- [x] ThemeToggle (ui/ThemeToggle.jsx)
- [x] AlertDialog (ui/AlertDialog.jsx)
- [x] Spinner (ui/Spinner.jsx)
- [ ] Tooltip (ui/Tooltip.jsx)
- [ ] Modal (ui/Modal.jsx)

### Chat Components
- [ ] ChatWindow (chat/ChatWindow.jsx)
- [ ] Message (chat/Message.jsx)
- [ ] MessageInput (chat/MessageInput.jsx)
- [ ] ContextWindow (chat/ContextWindow.jsx)
- [ ] Thinking (chat/Thinking.jsx)
- [ ] ChatList (chat/ChatList.jsx)
- [ ] ChatHeader (chat/ChatHeader.jsx)
- [ ] CodeBlock (chat/CodeBlock.jsx)

### Layout Components
- [x] Sidebar (layout/Sidebar.jsx)
- [ ] Header (layout/Header.jsx)
- [ ] Footer (layout/Footer.jsx)
- [ ] MainLayout (layout/MainLayout.jsx)
- [ ] Settings (layout/Settings.jsx)

### Project Components
- [x] ProjectList (project/ProjectList.jsx)
- [x] ProjectSelector (project/ProjectSelector.jsx)
- [x] ProjectHeader (project/ProjectHeader.jsx)
- [x] NewProjectModal (project/NewProjectModal.jsx)
- [ ] ProjectPage (project/ProjectPage.jsx)
- [ ] ProjectSettings (project/ProjectSettings.jsx)

### Model Components
- [x] ModelSelector (model/ModelSelector.jsx)
- [x] ModelConfig (model/ModelConfig.jsx)

### Error Handling
- [x] ErrorBoundary (error/ErrorBoundary.jsx)

### Utils & Context Organization
- [x] Create index.js for utils
- [x] Create index.js for context
- [x] Create utils/logger.js for improved logging
- [x] Create utils/localStorage.js for storage operations
- [x] Create utils/models.js for model-related utility functions
- [x] Create utils/formatters.js for formatting utilities
- [ ] Consolidate styles
- [ ] Add consistent PropTypes validation
- [ ] Add more JSDoc comments

## Implementation Steps

1. ✅ Create the directory structure
2. ✅ Move components to appropriate directories
3. ✅ Update imports in all files
4. ⏳ Refactor components as needed
5. ⏳ Add missing PropTypes validation
6. ⏳ Add JSDoc comments for better documentation

## Next Steps

1. Move and refactor the remaining components in this order:
   - Chat components
   - Layout components
   - Project components

2. Create consistent styling for all components
   - Apply BEM methodology
   - Create CSS variables for theming
   - Ensure responsive design

3. Add tests for components
   - Unit tests
   - Integration tests

## Testing

After each component is moved:
1. Verify the app renders without errors
2. Test component functionality
3. Fix any import errors or styling issues