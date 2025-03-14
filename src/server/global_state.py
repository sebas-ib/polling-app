from models import Client, Poll
from typing import Dict

# Global dictionaries for storing client and poll info
clients: Dict[str, Client] = {}
polls: Dict[str, Poll] = {}

socket_client_map: Dict[str, str] = {}
