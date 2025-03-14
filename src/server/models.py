from dataclasses import dataclass, field
from typing import Set


@dataclass
class Client:
    id: str  # unique identifier
    name: str
    saved_votes: Set[str] = field(default_factory=set)
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
# keep em mutable

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
    poll_options: Set['PollOption'] = field(default_factory=set)

    def __hash__(self):
        return hash(self.id)

    def __eq__(self, other):
        if not isinstance(other, PollQuestion):
            return False
        return self.id == other.id


@dataclass
class Poll:
    id: str   # id for poll
    title: str
    owner: Client  # owner is a client id
    max_participants: int = 24
    participants: Set[Client] = field(default_factory=set)  # clients in poll
    poll_questions: Set[PollQuestion] = field(default_factory=set)

