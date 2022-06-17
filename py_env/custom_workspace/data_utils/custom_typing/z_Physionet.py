from enum import Enum, auto
import z_Typing as z

PHYSIONET_LOC = "D:/bachelor-thesis/data/physionet/"


class Labels(Enum):
    REST = auto()
    LEFT_FIST = auto()
    RIGHT_FIST = auto()
    BOTH_FISTS = auto()
    BOTH_FEETS = auto()
    BASELINE_EYES_CLOSED = auto()
    BASELINE_EYES_OPENED = auto()


class Channels(Enum):
    FC5 = "FC5"
    FC3 = "FC3"
    FC1 = "FC1"
    FCZ = "FCz"
    FC2 = "FC2"
    FC4 = "FC4"
    FC6 = "FC6"
    C5 = "C5"
    C3 = "C3"
    C1 = "C1"
    CZ = "Cz"
    C2 = "C2"
    C4 = "C4"
    C6 = "C6"
    CP5 = "CP5"
    CP3 = "CP3"
    CP1 = "CP1"
    CPZ = "CPz"
    CP2 = "CP2"
    CP4 = "CP4"
    CP6 = "CP6"
    FP1 = "Fp1"
    FPZ = "Fpz"
    FP2 = "Fp2"
    AF7 = "AF7"
    AF3 = "AF3"
    AFZ = "AFz"
    AF4 = "AF4"
    AF8 = "AF8"
    F7 = "F7"
    F5 = "F5"
    F3 = "F3"
    F1 = "F1"
    FZ = "Fz"
    F2 = "F2"
    F4 = "F4"
    F6 = "F6"
    F8 = "F8"
    FT7 = "FT7"
    FT8 = "FT8"
    T7 = "T7"
    T8 = "T8"
    T9 = "T9"
    T10 = "T10"
    TP7 = "TP7"
    TP8 = "TP8"
    P7 = "P7"
    P5 = "P5"
    P3 = "P3"
    P1 = "P1"
    PZ = "Pz"
    P2 = "P2"
    P4 = "P4"
    P6 = "P6"
    P8 = "P8"
    PO7 = "PO7"
    PO3 = "PO3"
    POZ = "POz"
    PO4 = "PO4"
    PO8 = "PO8"
    O1 = "O1"
    OZ = "Oz"
    O2 = "O2"
    IZ = "Iz"


class Tasks(Enum):
    TASK1 = "open and close left or right fist"
    TASK2 = "imagine opening and closing left or right fist"
    TASK3 = "open and close both fists or both feet"
    TASK4 = "imagine opening and closing both fists or both feet"


"""
Baseline, eyes open
Baseline, eyes closed
Task 1 (open and close left or right fist)
Task 2 (imagine opening and closing left or right fist)
Task 3 (open and close both fists or both feet)
Task 4 (imagine opening and closing both fists or both feet)
Task 1
Task 2
Task 3
Task 4
Task 1
Task 2
Task 3
Task 4
"""
LEFT_RIGHT_FIST_RUNS = [3, 4, 7, 8, 11, 12]

FIST_FEET_RUNS = [run + 2 for run in LEFT_RIGHT_FIST_RUNS]

RUN_DESCRIPTION_LOOKUP: dict[int, str] = {
    1: "Eyes closed baseline",
    2: "Eyes opened baseline",
}
for i in range(3, 15):
    j = i - 3
    if j % 4 == 0:
        RUN_DESCRIPTION_LOOKUP[i] = Tasks.TASK1
    elif j % 4 == 1:
        RUN_DESCRIPTION_LOOKUP[i] = Tasks.TASK2
    elif j % 4 == 2:
        RUN_DESCRIPTION_LOOKUP[i] = Tasks.TASK3
    else:
        RUN_DESCRIPTION_LOOKUP[i] = Tasks.TASK4


def event_ref_to_event(ref: int, run: int) -> Labels:
    if run in LEFT_RIGHT_FIST_RUNS:
        if ref == 1:
            return Labels.REST
        elif ref == 2:
            return Labels.LEFT_FIST
        elif ref == 3:
            return Labels.RIGHT_FIST
        else:
            raise ValueError("ref 1, 2 or 3 please")
    elif run in FIST_FEET_RUNS:
        if ref == 1:
            return Labels.REST
        elif ref == 2:
            return Labels.BOTH_FISTS
        elif ref == 3:
            return Labels.BOTH_FEETS
        else:
            raise ValueError("ref 1, 2 or 3 please")
    elif run == 1:
        return Labels.BASELINE_EYES_OPENED
    elif run == 2:
        return Labels.BASELINE_EYES_CLOSED
    else:
        raise ValueError("invalid run: " + str(run))


class Annotation(z.Annotation):
    label: Labels
    timestamps: list[int]
    run_index: int
    run_description: str
    subject: int
    channels: list[str]
    frequency: int

    def __init__(
        self,
        run: int,
        label: Labels,
        timestamps: list[int],
        subject: int,
        channels: list[str],
        frequency: int = 0,
    ) -> None:
        assert run >= 1 and run <= 14
        assert subject >= 1 and subject <= 109
        super().__init__()
        self.run_index = run
        self.run_description = RUN_DESCRIPTION_LOOKUP[run]
        self.label = label
        self.timestamps = timestamps
        self.subject = subject
        self.channels = channels
        self.frequency = frequency


class ChannelSettings(Enum):
    MUSE = auto()
    CROWN = auto()
    MUSE_AND_CROWN = auto()
