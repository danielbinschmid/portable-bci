import numpy as np
import os
import pandas
from u_filters import butter_bandpass_filter
import json
CLASSID_TO_LABEL = {
    "left": 0,
    "right": 1
}

def interpolate_channels(channels: np.ndarray):
    for chIdx in range(channels.shape[0]):
        for t in range(channels.shape[1]):
            if np.isnan(channels[chIdx][t]):
                if t > 0:
                    channels[chIdx][t] = channels[chIdx][t - 1]
                else: 
                    if np.isnan(channels[chIdx][t + 1]):
                        raise Exception("first timesteps are nan")
                    channels[chIdx][t] = channels[chIdx][t + 1]
    return channels

def resample(nb_timesteps, target_frequency, windowlength_seconds):
    """
    data of shape (nb_trials, nb_channels, nb_timesteps)
    """
    target_nb_timesteps = int(target_frequency * windowlength_seconds)
    l = list(np.linspace(0, nb_timesteps - 1, target_nb_timesteps).astype(int))
    return l

def readsubject(subject: int) -> tuple[list[np.ndarray], np.ndarray]:
    assert subject in [2, 3, 4, 5]

    # ----------- CONFIG -----------
    path = "./data/musemotorimagery_reduced"
    frequency = 250
    classes = ["left", "right"]

    channel_col_names = ["RAW_TP9", "RAW_AF7", "RAW_AF8", "RAW_TP10"]
    # ------------------------------

    trial_data, labels = [], []
    for c in classes:
        data_path = os.path.join(path, c, str(subject)) + "/"
        all_files = os.listdir(data_path)
        
        for filename in all_files:
            full_file_path = os.path.join(data_path, filename) 
            df = pandas.read_csv(full_file_path)
            # print(df.head())
            df_ = df[channel_col_names]
            data = df_.to_numpy().T

            # bandpass filter and centering
            data = interpolate_channels(data)
            data = data - np.mean(data, axis=1, keepdims=True)
            for chIdx in range(data.shape[0]):
                data[chIdx] = butter_bandpass_filter(data[chIdx], 0.5, 48, frequency, order=2)

            trial_data.append(data)
            labels.append(CLASSID_TO_LABEL[c])

    return trial_data, np.asarray(labels)

def read_crops(subject: int, target_frequency: float=128, train_split: float= 0.0, crop_session_size: float=4.0) -> tuple[list[np.ndarray], list[int]]:
    """
    Computes a realistic split. 
    
    Takes the first recorded trial as training trial.
    """
    assert subject in [2, 3, 4, 5]

    # ------------- CONFIG -------------
    frequency = 250 # in Hz
    crop_shift = 25 # int
    crop_session_size = crop_session_size # float, in seconds
    crop_size = frequency * crop_session_size
    # ----------------------------------

    trial_data, labels = readsubject(subject=subject)

    # read total trial range
    total_ts = [0, 0]
    for trialIdx in range(labels.shape[0]):
        total_ts[labels[trialIdx]] += trial_data[trialIdx].shape[1]
    

    train_split_ts =[int(train_split * (total_ts[i] - crop_size)) for i in [0, 1]]
    current_ts = [0, 0]
    t_last_trials = [0, 0]
    is_train_split = [train_split_ts[0] + train_split_ts[1] > crop_size for i in range(2)]

    cropped_data, cropped_labels = [], []
    cropped_train_data, cropped_train_labels = [], []
    for trialIdx in range(labels.shape[0]):
        # crop trials
        trialLabel = labels[trialIdx]
        trialData = trial_data[trialIdx] # of shape (channels, time)
        virtual_time_idx = 0
        
        total_size = trialData.shape[1]
        while virtual_time_idx + crop_size < total_size:
            crop_data = trialData[:, virtual_time_idx:virtual_time_idx+crop_size]
            virtual_time_idx += crop_shift
            current_ts[trialLabel] += crop_shift

            if current_ts[trialLabel] + crop_size >= train_split_ts[trialLabel] and is_train_split[trialLabel]:
                is_train_split[trialLabel] = False
                virtual_time_idx = train_split_ts[trialLabel]

            if is_train_split[trialLabel]:
                cropped_train_data.append(crop_data)
                cropped_train_labels.append(trialLabel)
            else:
                cropped_data.append(crop_data)
                cropped_labels.append(trialLabel)
        
        current_ts[trialLabel] = t_last_trials[trialLabel] + total_size
        t_last_trials[trialLabel] += total_size


    resample_indeces = resample(crop_session_size * frequency, target_frequency, crop_session_size)


    for i in range(len(cropped_data)):
        cropped_data[i] = cropped_data[i][:, resample_indeces]

    for i in range(len(cropped_train_data)):
        cropped_train_data[i] = cropped_train_data[i][:, resample_indeces]

    return cropped_data, cropped_labels, cropped_train_data, cropped_train_labels


def read_crops_4fold():
    raise NotImplementedError()

def read_crops_kfold():
    raise NotImplementedError()


def export_json():
    # --------- CONFIG ----------
    subjects = [2, 3, 4, 5]
    
    save_path_raw = "./data/museMIJson/"

    # ---------------------------
    for subject in subjects:
        data, labels = readsubject(subject)
        trial_container = {}
        for trialIdx in range(len(data)):
            trial, label = data[trialIdx], labels[trialIdx]
            container = {
                "data": trial.tolist(),
                "label": int(label)
            }
            trial_container["trial_" + str(trialIdx)] = container
        print(trial_container)
        with open(save_path_raw + "subj_" + str(subject) + ".json", 'w', encoding='utf-8') as f:
            json.dump(trial_container, f)


if __name__ == "__main__":
    os.chdir("..")
    d, l = read_crops(2)
    # print(d[0])
    # export_json()