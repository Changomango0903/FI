import logging
import sys
from app.config import settings

class CustomFormatter(logging.Formatter):
    """Custom formatter with color support for console logging"""
    
    COLORS = {
        'DEBUG': '\033[94m',  # Blue
        'INFO': '\033[92m',   # Green
        'WARNING': '\033[93m', # Yellow
        'ERROR': '\033[91m',  # Red
        'CRITICAL': '\033[91m\033[1m',  # Bold Red
        'RESET': '\033[0m'    # Reset
    }
    
    def format(self, record):
        log_message = super().format(record)
        if record.levelname in self.COLORS and sys.stderr.isatty():
            log_message = f"{self.COLORS[record.levelname]}{log_message}{self.COLORS['RESET']}"
        return log_message


def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger instance with the given name.
    
    Args:
        name: The name of the logger, typically __name__
        
    Returns:
        A configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Set the log level based on settings
    logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Only add handlers if they don't exist yet
    if not logger.handlers:
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(
            CustomFormatter(
                fmt=settings.LOG_FORMAT,
                datefmt=settings.LOG_DATE_FORMAT
            )
        )
        logger.addHandler(console_handler)
    
    # Don't propagate to the root logger
    logger.propagate = False
    
    return logger 