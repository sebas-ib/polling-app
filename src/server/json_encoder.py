import json
from dataclasses import asdict, is_dataclass


def to_serializable(obj):
    """
    Recursively converts a dataclass (or other objects) containing non-serializable types,
    such as sets, into JSON-serializable objects.
    """
    # If obj is a dataclass, convert it to a dict
    if is_dataclass(obj):
        obj = asdict(obj)

    # If obj is a dictionary, recursively process its values
    if isinstance(obj, dict):
        return {key: to_serializable(value) for key, value in obj.items()}

    # If obj is a list, recursively process its items
    if isinstance(obj, list):
        return [to_serializable(item) for item in obj]

    # If obj is a set, convert it to a list (and process each item)
    if isinstance(obj, set):
        return [to_serializable(item) for item in obj]

    # For all other types, return the object as is
    return obj
