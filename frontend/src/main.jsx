import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import App from './App.jsx'
import { logger, LOG_LEVELS, setLogLevel } from './utils'
import { APP_CONFIG } from './config'

// Initialize logger with appropriate log level based on environment
if (process.env.NODE_ENV === 'production') {
  setLogLevel(LOG_LEVELS.WARN)
  logger.info('Main', 'Production mode - setting log level to WARN')
} else {
  setLogLevel(LOG_LEVELS.DEBUG)
  logger.info('Main', 'Development mode - setting log level to DEBUG')
}

logger.info('Main', `Starting ${APP_CONFIG.APP_NAME} v${APP_CONFIG.APP_VERSION}`)

// Create app root
const rootElement = document.getElementById('root')
if (!rootElement) {
  logger.error('Main', 'Root element not found')
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

logger.info('Main', 'App rendered successfully')
