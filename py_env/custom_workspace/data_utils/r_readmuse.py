from math import fabs
import os
import json
import mne
import numpy as np
import sys
import z_Typing as z
from u_preprocess_utils import frequency_bands_muse
from z_Muse import Labels, event_ref_to_event


def read_edf(session_size: float, classes) -> tuple[list, z.Annotation]:
    def to_annotated_epochs(
        time_annotations,
        channel_data,
        event_times: list[tuple[any, Labels]],
        channels: list[int],
    ):
        """

        @returns
        - list[np.ndarray, physio.Labels] where array is of shape (channels, bands, timepoints)
        """
        file_data = []
        current_label = event_times[0][1]
        nxt_event_idx = 1
        epoch_data = [[] for ch in channels]

        def get_next_event(nxt_ev_idx: int):
            if nxt_ev_idx >= len(event_times) - 1:
                return "END"
            else:
                return event_times[nxt_ev_idx + 1]

        nxt_event_time, nxt_event_label = get_next_event(0)
        for i in range(len(time_annotations)):
            timepoint = time_annotations[i]
            print(timepoint)
            if timepoint >= nxt_event_time:
                if current_label in classes and nxt_event_idx - 1 != 0:
                    annotation = z.Annotation(current_label)
                    epoch_data_np = np.asarray(epoch_data)
                    epoch_data_np = np.transpose(epoch_data_np, [0, 2, 1])
                    file_data.append((epoch_data_np, annotation))
                epoch_data = [[] for ch in channels]
                current_label = nxt_event_label
                if get_next_event(nxt_event_idx) != "END":
                    nxt_event_time, nxt_event_label = get_next_event(nxt_event_idx)
                    nxt_event_idx += 1
                else:
                    nxt_event_time = time_annotations[len(time_annotations) - 1]
                    nxt_event_idx += 1
            for j in range(len(channel_data)):
                ch = channel_data[j]
                epoch_data[j].append(ch[i])

        return file_data

    data = []
    LOC = "D:/bachelor-thesis/data/formatted/yaoyao2604edf/yaoyao2604edf.edf"
    raw_edf = mne.io.read_raw_edf(LOC)
    mne.datasets.eegbci.standardize(raw_edf)
    events, _ = mne.events_from_annotations(raw_edf)
    raw_data = raw_edf.get_data()
    event_times = [
        (ev[0] / raw_edf.info["sfreq"], event_ref_to_event(ev[2])) for ev in events
    ]
    channel_data = []
    time_annotations = []
    for spatial_channel in raw_data:
        # spatial_channel = spatial_channel * (10 ** 6) # Normalize data to uV
        bands, time_annotations = frequency_bands_muse(
            spatial_channel, raw_edf.info["sfreq"]
        )
        assert len(bands) == len(time_annotations)
        channel_data.append(bands)

    # Annotate frequency bands
    file_data = to_annotated_epochs(
        time_annotations, channel_data, event_times, [0, 1, 2, 3]
    )
    data = file_data

    max_timesteps = sys.float_info.max
    frequency = 10
    for epoch_data, anno in data:
        t = epoch_data.shape[2]
        if t < max_timesteps:
            max_timesteps = t
    max_time = max_timesteps / frequency
    if session_size < max_time:
        t_steps = int(session_size * frequency)
    else:
        t_steps = max_timesteps
    for i in range(len(data)):
        epoch_data, anno = data[i]
        cut = epoch_data[:, :, 0:t_steps]
        data[i] = (cut, anno)
    return data


def convert_to_edf(
    LOC: str = "D:/bachelor-thesis/data/formatted/yaoyao2604",
    EXPORT_LOC: str = "D:/bachelor-thesis/data/formatted/yaoyao2604edf",
    rename_rest_trial_filenames=False,
):
    """
    Converts collected data on-edge available as JSON file to an .edf file. 

    JSON file is of shape: {"data": list[float], "channelIdx": 0 | 1 | 2 | 3, "arrival": int, "alignedIdx: int} 
    """
    CHANNELS = [0, 1, 2, 3]
    SAMPLES_PER_BLE_PACKET = 12
    FREQUENCY = 256
    CHANNEL_NAMES = ["AF7", "AF8", "TP9", "TP10"]

    filenames = os.listdir(LOC)

    def rename_rest_trial_files():
        """
        Corrects REST trial filenames by renaming trial_idx -> trial_idx - 1
        """
        rest_filenames = [
            fname for fname in filenames if fname.startswith("label-REST")
        ]
        for rest_fname in rest_filenames:
            idx_trial = rest_fname.find("_trial-")
            idx_date = rest_fname.find("_date")
            idx_start = idx_trial + 7
            idx_end = idx_date
            number = int(rest_fname[idx_start:idx_end])
            updated_num = number - 1
            updated_fname = rest_fname.replace(
                "_trial-" + str(number), "_trial-" + str(updated_num)
            )
            os.rename(os.path.join(LOC, rest_fname), os.path.join(LOC, updated_fname))

    if rename_rest_trial_filenames:
        rename_rest_trial_files()
    # iterate through each consecutive file
    trial_idx = 0
    num_trials = len(filenames)

    def get_last_timestep() -> int:
        trial_id = "_trial-" + str(len(filenames) - 1) + "_"
        trial_file = [fname for fname in filenames if fname.rfind(trial_id) != -1][0]
        input_file = open(os.path.join(LOC, trial_file))
        json_array = json.load(input_file)
        packet_indeces = [item["alignedIdx"] for item in json_array]
        packet_indeces.sort()
        last_idx = packet_indeces[len(packet_indeces) - 1]
        return SAMPLES_PER_BLE_PACKET * last_idx

    raw_data = np.zeros((len(CHANNELS), get_last_timestep()))
    event_data = []

    def get_first_full_timestep(json_array):
        def first_packet_idx():
            packet_indeces = [item["alignedIdx"] for item in json_array]
            packet_indeces.sort()
            for item in packet_indeces:
                if packet_indeces.count(item) == 4:
                    return item
            return None

        idx = first_packet_idx()
        if idx is None:
            raise ValueError("no full timestep available in file")
        return (idx - 1) * SAMPLES_PER_BLE_PACKET

    def get_file_event(filename: str, json_array):
        if filename[6] == "1":
            print(1)
            event = 1
        elif filename[6] == "0":
            print(0)
            event = 0
        else:
            event = 2
        # last timestep minus number of
        return [get_first_full_timestep(json_array), 0, event]

    for i in range(num_trials):
        trial_id = "_trial-" + str(trial_idx) + "_"
        print(trial_id)
        trial_file = [fname for fname in filenames if fname.rfind(trial_id) != -1][0]
        trial_idx += 1

        input_file = open(os.path.join(LOC, trial_file))
        json_array = json.load(input_file)
        event_data.append(get_file_event(trial_file, json_array))

        for item in json_array:
            for channel in CHANNELS:
                if item["channelIdx"] == channel:
                    packet_idx = item["alignedIdx"] - 1
                    offset_packet = SAMPLES_PER_BLE_PACKET * packet_idx
                    item_data = item["data"]
                    for datapoint_idx in range(len(item_data)):
                        raw_data[channel][offset_packet + datapoint_idx] = item_data[
                            datapoint_idx
                        ]

    raw_data = raw_data * (10 ** (-6))

    info = mne.create_info(ch_names=CHANNEL_NAMES, sfreq=FREQUENCY, ch_types="eeg")
    raw = mne.io.RawArray(data=raw_data, info=info, first_samp=0)

    annos = mne.annotations_from_events(
        events=np.asarray(event_data),
        sfreq=256,
        event_desc={0: "Left arm", 1: "right arm", 2: "rest"},
    )
    raw.set_annotations(annos)
    raw.export(os.path.join(EXPORT_LOC, "yaoyao2604edf.edf"))


if __name__ == "__main__":
    # raw = convert_to_edf()
    data = read_edf(19.8, [Labels.LEFT_ARM, Labels.RIGHT_ARM])

    for epoch, anno in data:
        print(epoch.shape)
