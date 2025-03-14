from dataclasses import dataclass, field
from typing import Set

@dataclass
class Client:
    id: str
    name: str

@dataclass
class Poll:
    id: str
    name: str
    owner: str  # Store the owner as a client id.
    maxParticipants: int = 8
    clients: Set[str] = field(default_factory=set)
