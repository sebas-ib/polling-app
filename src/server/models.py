from dataclasses import dataclass, field
from typing import Dict


@dataclass
class Client:
    id: str  # unique identifier
    name: str
    saved_votes: set[str] = field(default_factory=set)

    def __hash__(self):
        return hash(self.id)

    def __eq__(self, other):
        if isinstance(other, Client):
            return self.id == other.id
        return False


@dataclass
class PollOption:
    id: str
    text: str
    vote_count: int

    def __hash__(self):
        return hash(self.id)

    def __eq__(self, other):
        if isinstance(other, PollOption):
            return self.id == other.id
        return False


@dataclass
class PollQuestion:
    id: str
    question_title: str
    # Use a dictionary for poll_options keyed by option id.
    poll_options: Dict[str, PollOption] = field(default_factory=dict)

    def __hash__(self):
        return hash(self.id)

    def __eq__(self, other):
        if not isinstance(other, PollQuestion):
            return False
        return self.id == other.id


@dataclass
class Poll:
    id: str  # id for poll
    title: str
    owner: Client  # owner is a Client object
    max_participants: int = 24
    # Use dictionaries for easier lookups.
    participants: Dict[str, Client] = field(default_factory=dict)
    poll_questions: Dict[str, PollQuestion] = field(default_factory=dict)
