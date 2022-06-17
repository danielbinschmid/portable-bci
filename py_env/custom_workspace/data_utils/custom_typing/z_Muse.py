from enum import Enum, auto


class Labels(Enum):
    LEFT_ARM = auto()
    RIGHT_ARM = auto()
    REST = auto()


def event_ref_to_event(ref: int):
    if ref == 1:
        return Labels.LEFT_ARM
    elif ref == 3:
        return Labels.RIGHT_ARM
    else:
        return Labels.REST
