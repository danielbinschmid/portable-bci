import os
import numpy as np
import json
from folder_locs import MODE_IDS_EEGNET

def load_hdc_benchmarks(folder: str):
    """
    - loads single folder
    - averages test_trials
    - returns accuracy for each subject and network
    """
    n_subjects = 5
    k = 4

    files = os.listdir(folder)

    benchmarks = np.zeros((n_subjects, k, 2))
    for file in files:
        p = os.path.join(folder, file)
        raw_data = np.load(p)[
            "success"
        ] # shape (n_subjects, k, 4) - last dim. is [SVM, LDA, HDC_TEST, HDC_TRAIN]
        benchmarks += raw_data[:, :, [0, 2]]
    
    return benchmarks / len(files)

def load_eegnet_benchmarks(loc: str):
    """
    - loads whole json
    """
    n_subjects = 4
    k = 4
    n_modes = 3

    benchmarks = []

    with open(loc) as f:
        file = json.load(f)

        benchmarks = [[[file[mode][subject][k_id] for k_id in file[mode][subject]] for subject in file[mode]] for mode in MODE_IDS_EEGNET]
        benchmarks = np.asarray(benchmarks) # of shape (n_modes, n_subjects, k)
        return benchmarks

def load_for_modes(HDC_folders: list, EEGNetfile: str, average_for_modes: bool = True, average_k: bool = False):
    EEGNet_benchmarks = load_eegnet_benchmarks(EEGNetfile)
    shape = EEGNet_benchmarks.shape
    EEGNet_benchmarks = EEGNet_benchmarks.reshape((shape[0], shape[1], shape[2], 1))

    hdc_svm_benchmarks = []
    for folder in HDC_folders:
        b = load_hdc_benchmarks(folder)
        hdc_svm_benchmarks.append(b)

    hdc_svm_benchmarks = np.asarray(hdc_svm_benchmarks)

    benchmarks = np.concatenate((EEGNet_benchmarks, hdc_svm_benchmarks), axis=3)

    shape = ["modes", "subjects", "k", "networks"]
    labels = {
        "modes": MODE_IDS_EEGNET,
        "subjects": ["subj_" + str(subj) for subj in range(5)],
        "networks": ["EEGNet", "SVM", "HDC"]
    }

    if average_for_modes:
        benchmarks = np.mean(benchmarks, (1, 2))
        shape = ["modes", "networks"]
    elif average_k:
        benchmarks = np.mean(benchmarks, (2))
        shape = ["modes", "subjects", "networks"]
    
    return benchmarks, shape, labels
    
    
f2 = "D:/bachelor-thesis/python_workspace/wearble-bci-app/torch_modules/benchmarks/eegnet-3classMI_-1-2_20220604-210508/all_eegnet-3classMI_-1-2_20220604-210508.json"
f = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/3classMI/results/"

def load():
    hdc_ids = ["subject_adaptive", "subject_dependent", "subject_independent"]
    hdc_ids = [os.path.join(f, id) for id in hdc_ids]
    
    load_for_modes(hdc_ids, f2)
