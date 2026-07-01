import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("shl_recommender")

# Settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CATALOG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "shl_catalog.json")

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY environment variable is not set. Please configure it in your secrets.")
