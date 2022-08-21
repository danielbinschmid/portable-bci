import os
from enum import Enum, auto


class Modes(Enum):
    SUBJECT_ADAPTIVE = auto()
    SUBJECT_INDEPENDENT = auto()
    SUBJECT_DEPENDENT = auto()

MODES = [Modes.SUBJECT_ADAPTIVE, Modes.SUBJECT_INDEPENDENT, Modes.SUBJECT_DEPENDENT]

modeids_EEGNet = {
    Modes.SUBJECT_ADAPTIVE: "subject-adaptive",
    Modes.SUBJECT_INDEPENDENT: "subject-independent",
    Modes.SUBJECT_DEPENDENT: "subject-dependent"
}


modeids_HDC_3class = {
    Modes.SUBJECT_ADAPTIVE:    "05-06_3class_subject-adaptive",
    Modes.SUBJECT_INDEPENDENT: "05-06_3class_subject-independent",
    Modes.SUBJECT_DEPENDENT:   "05-06_3class_subject-dependent"
}

modeids_HDC_2class = {
    Modes.SUBJECT_ADAPTIVE:    "05-06_2class_subject-adaptive",
    Modes.SUBJECT_INDEPENDENT: "05-06_2class_subject-independent",
    Modes.SUBJECT_DEPENDENT:   "05-06_2class_subject-dependent"
}



MODE_IDS_EEGNET = [modeids_EEGNet[mode] for mode in MODES]
MODE_IDS_HDC_3CLASS = [modeids_HDC_3class[mode] for mode in MODES]
MODE_IDS_HDC_2CLASS = [modeids_HDC_2class[mode] for mode in MODES]

HDC_LOC = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/3classMI/results/"

EEGNET_GLOBAL = "D:/bachelor-thesis/python_workspace/wearble-bci-app/torch_modules/benchmarks"

EEGNET_ID_2CLASS = "-"
EEGNET_ID_3CLASS = "eegnet-3classMI_-1-2-3_20220605-112422"

THREE_CLASS_EEGNET = os.path.join(EEGNET_GLOBAL, EEGNET_ID_3CLASS, "all_" + EEGNET_ID_3CLASS + ".json")
TWO_CLASS_EEGNET   = os.path.join(EEGNET_GLOBAL, EEGNET_ID_2CLASS, "all_" + EEGNET_ID_2CLASS + ".json")





