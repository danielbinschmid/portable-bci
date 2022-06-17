from sqlite3 import DatabaseError
import numpy as np
import scipy.io as sio
from u_filters import butter_bandpass_filter
import glob
from enum import Enum, auto


N_CHANNELS = 16

TRIALS_SESSION = 45  # number of trials per session
# Codes used in EEG recording protocol
START_CODE = 781
LEFT_CODE = 769
RIGHT_CODE = 770
FEET_CODE = 771
REST_CODE = 783
FIXC_CODE = 786

CORRECT_COMM = 897
WRONG_COMM = 898

# Frequency of sampling
FS = 512
# Duration of each task in second
TASK_DURATION = 4  # [sec]
# Number of samples in a mental command
N_SAMPLES = TASK_DURATION * FS


def get_decoded_data(file_list, class_vec=[1, 2], downsample_factor=2):
    """
	Load signals and label from file_list 

	Parameters
	----------
	file_list: list of strings, shape (n_files)
		input file list 
	
	Return
	------
	out_data : array, shape (n_trial,N_CHANNELS, N_SAMPLES)
		output data stacked to trials 
	"""

    n_trial = TRIALS_SESSION * len(file_list)  #
    out_label = np.zeros(n_trial, dtype=int)
    out_data = np.zeros((n_trial, N_CHANNELS, int(N_SAMPLES / downsample_factor)))
    out_idx = 0
    # add_alternate = [0, 0]
    # division_factor = 2
    for file in file_list:
        # loat data
        data = sio.loadmat(file)
        # dict_keys(['__header__', '__version__', '__globals__', 'FileList', 'FilePath', 'Position', 'Trigger', 'header', 'i', 'signal']
        Trigger = data["Trigger"]
        Position = data["Position"]
        # remove mean from signal
        signal = data["signal"] - np.mean(data["signal"])
        # laplacian filter (Spatial)
        # signal = np.matmul(signal,lap_filt)
        # print(signal.shape)
        assert downsample_factor - int(downsample_factor) == 0
        compress_lookup = np.array(
            [i % downsample_factor == 0 for i in range(signal.shape[0])]
        )
        signal = np.compress(compress_lookup, signal, axis=0)

        # bandpass filtering
        # print(signal.shape)
        signal = butter_bandpass_filter(
            signal, lowcut=0.1, highcut=100, fs=int(512 / downsample_factor), order=4
        )
        for idx in range(len(Trigger)):
            if Trigger[idx] == FIXC_CODE:
                fixation_start = Position[idx]
            elif Trigger[idx] == LEFT_CODE:
                label = 1
                fixation_end = Position[idx]
            elif Trigger[idx] == RIGHT_CODE:
                label = 2
                fixation_end = Position[idx]
            elif Trigger[idx] == FEET_CODE:
                label = 3
                fixation_end = Position[idx]
            elif Trigger[idx] == REST_CODE:
                label = 0
            elif Trigger[idx] == START_CODE:
                if label in class_vec:
                    # if add_alternate[label - 1] == 0:  # division_factor - 1
                        # task starts with START_CODE and lasts for 4 sec
                    task_start = int(Position[idx])
                    task_end = task_start + N_SAMPLES
                    task_start = int(task_start / downsample_factor)
                    task_end = int(task_end / downsample_factor)
                    out_data[out_idx] = signal[task_start:task_end].transpose()
                    out_label[out_idx] = label
                    out_idx += 1
                    # add_alternate[label - 1] = (
                    #     add_alternate[label - 1] + 1
                    # ) % division_factor
    # print("$$")
    # print(out_data[:out_idx].shape)
    d = out_data[:out_idx]
    shape = d.shape
    out_data_less_channels = np.zeros((shape[0], 4, shape[2]))

    CHANNELS = [1, 5, 11, 15]
    out_data_less_channels = d[:, CHANNELS, :]
    # print(out_data_less_channels)
    return out_data_less_channels, out_label[:out_idx]


class DataModes(Enum):
    SUBJECT_ADAPTIVE = "subject-adaptive"
    SUBJECT_INDEPENDENT = "subject-independent"
    SUBJECT_DEPENDENT = "subject-dependent"
    ALL = "all"

def get_data(
    global_dataset_path, subject: int, fold: int, do_print: bool, downsample_factor: int, mode: str=DataModes.SUBJECT_ADAPTIVE.value, class_vec=[1, 2]
):
    # -------- CONFIG ----------
    offline_subject_folder = {1: "/S1/", 2: "/S2/", 3: "/S3/", 4: "/S4/", 5: "/S5/"}
    data_modes = [DataModes.SUBJECT_ADAPTIVE, DataModes.SUBJECT_DEPENDENT, DataModes.SUBJECT_INDEPENDENT, DataModes.ALL]
    # --------------------------


    for data_mode in data_modes:
        if mode == data_mode.value:
            mode = data_mode
    if isinstance(mode, str):
        raise ValueError("Either %s, %s or %s passed as string"%(mode.value for mode in data_modes))

    for c in class_vec:
        if c < 1 or c > 3:
            raise ValueError(r"classes of class_vec must be $\in \{1, 2, 3\}$ ")


    # ------- gen file list --------
    target_subject_files = glob.glob(
        global_dataset_path + offline_subject_folder[subject] + "*.mat"
    )
    n_files = len(target_subject_files)

    if mode == DataModes.ALL:
        train_file_list = target_subject_files
        test_file_list = []
    elif mode == DataModes.SUBJECT_INDEPENDENT:
        test_file_list = target_subject_files
        train_file_list = []
    else:
        test_file_list = [target_subject_files[fold % n_files]]
        train_file_list = target_subject_files
        train_file_list.remove(test_file_list[0])  # remove test file from train file list

    if mode != DataModes.SUBJECT_DEPENDENT:
        for subj in range(1, 6):
            if subj != subject:
                train_file_list = train_file_list + glob.glob(
                    global_dataset_path + offline_subject_folder[subj] + "*.mat"
                )
    # ----------------------------


    train_data, train_label = get_decoded_data(
        train_file_list, class_vec=class_vec, downsample_factor=downsample_factor
    )
    test_data, test_label = get_decoded_data(
        test_file_list, class_vec=class_vec, downsample_factor=downsample_factor
    )

    if do_print:
        print("Loaded EPFL dataset in cross validation")
        print(
            "Fold :{}/{} \nNumber of training trials: {} \nNumber of test trials: {}".format(
                fold, n_files, len(train_label), len(test_label)
            )
        )

    return train_data, train_label, test_data, test_label
