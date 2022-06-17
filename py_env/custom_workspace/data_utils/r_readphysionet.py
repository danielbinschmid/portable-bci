"""
Loads PhysioNet Motor Imagery dataset (https://physionet.org/content/eegmmidb/1.0.0/)
"""

import sys
import mne
import numpy as np
import z_Physionet as physio
from u_preprocess_utils import frequency_bands_muse, smallest_window_size
from t_physionet_tools import get_filenames
import os


def export_as_numpy():

    ########### SETTINGS ############

    channels = [
        physio.Channels.AF7,
        physio.Channels.AF8,
        physio.Channels.T9,
        physio.Channels.T10,
    ]
    classes = [physio.Labels.BOTH_FEETS, physio.Labels.BOTH_FISTS]
    imagined = True
    physical = False
    subjects = list(np.arange(1, 110))
    subjects.remove(88)
    subjects.remove(92)
    subjects.remove(100)
    print(subjects)
    subjects = np.asarray(subjects)
    tevent_window = 4.0
    export_location = "./data/physionet"

    #################################

    channels = [channel.value for channel in channels]
    files = get_filenames(
        classes=classes, imagined=imagined, physical=physical, subjects=subjects,
    )
    data = {subject: [] for subject in subjects}
    labels = {subject: [] for subject in subjects}

    for fname, run, subject in files:
        # -------- LOADING FILE ----------
        raw_edf = mne.io.read_raw_edf(fname, preload=True)
        mne.datasets.eegbci.standardize(raw_edf)
        montage = mne.channels.make_standard_montage("standard_1005")
        raw_edf.set_montage(montage)
        raw_edf.rename_channels(lambda x: x.strip("."))
        events, _ = mne.events_from_annotations(raw_edf)
        picks = mne.pick_types(
            raw_edf.info,
            meg=False,
            eeg=True,
            stim=False,
            eog=False,
            selection=channels,
        )
        smw = smallest_window_size(events, raw_edf)
        if tevent_window is not None:
            if tevent_window > smw:
                UserWarning(
                    "Chosen tevent_window size is too high, maximum is %f" % smw
                )
        else:
            tevent_window = smw
        # -------------------------------

        # ------- PREPROCESSING ---------
        raw_edf = raw_edf.filter(l_freq=0.1, h_freq=79.9, picks=picks)
        epochs = mne.Epochs(
            raw_edf,
            events,
            preload=True,
            picks=picks,
            proj=False,
            reject_by_annotation=False,
            tmin=0.0,
            tmax=tevent_window,
            baseline=None,
        )
        epochs_data = epochs.get_data()
        epochs_data *= 10 ** 6  # normalize microVolts
        # -------------------------------

        # ------- UNPACK ----------------

        n = 0
        n_relevant = 0
        print(epochs_data)
        for i in range(len(epochs_data)):
            n += 1
            label = physio.event_ref_to_event(events[i][2], run)
            if label == physio.Labels.BOTH_FEETS or label == physio.Labels.BOTH_FISTS:
                n_relevant += 1
                if label == physio.Labels.BOTH_FEETS:
                    labels[subject].append(1)
                else:
                    labels[subject].append(2)
                data[subject].append(epochs_data[i])
        print("subject: %d, events: %d, relevant events: %d" % (subject, n, n_relevant))
        # -------------------------------

    # --------- EXPORT ----------
    os.makedirs(export_location, exist_ok=True)
    for subject in subjects:

        subject_data = data[subject]
        subject_labels = labels[subject]
        assert len(subject_data) == len(subject_labels)

        subject_data = np.asarray(subject_data)
        subject_labels = np.asarray(subject_labels)
        d_loc = os.path.join(export_location, str(subject) + "_data")
        l_loc = os.path.join(export_location, str(subject) + "_labels")

        np.save(d_loc, subject_data)
        np.save(l_loc, subject_labels)


def fetch_as_bands(
    classes: list[physio.Labels] = None,
    channels: list[physio.Channels] = None,
    imagined=True,
    physical=False,
    subjects: list[int] = None,
    window_range: float = None,
):
    """
    It is recommended to only use this method if the raw_data needs to come in frequency bands. If the frequency bands can 
    be computed for each event without depending on previous data, don't use this method.

    The frequency bands are computed with FFTs in ~1.136 time intervals with an overlap of 0.1 / 1.136 seconds
    With this method, the computation of absolute bandpowers of the MuseIO library is simulated. 
    The first and last event of a run are dropped because they have lower amount of timesteps.

    Computes frequency bands from the raw data via following procedere:
    - First, pick channels
    - Then, execute data preprocessing
    - Then, get data
    - Then, compute frequency bands
    - Align annotations with frequency bands
    - Split data into Epochs
    """

    def to_annotated_epochs(
        time_annotations,
        channel_data,
        event_times: list[tuple[any, physio.Labels]],
        channel_str: list[str],
    ):
        """

        @returns
        - list[np.ndarray, physio.Labels] where array is of shape (channels, bands, timepoints)
        """
        file_data = []
        current_label = event_times[0][1]
        nxt_event_idx = 1
        epoch_data = [[] for ch in channel_str]

        def get_next_event(cur_ev_idx: int):
            if cur_ev_idx >= len(event_times) - 1:
                return "END"
            else:
                return event_times[cur_ev_idx + 1]

        nxt_event_time, nxt_event_label = get_next_event(0)
        for i in range(len(time_annotations)):
            timepoint = time_annotations[i]
            if timepoint >= nxt_event_time:
                if current_label in classes and nxt_event_idx - 1 != 0:
                    annotation = physio.Annotation(
                        run, current_label, [], subject, channel_str
                    )
                    epoch_data_np = np.asarray(epoch_data)
                    epoch_data_np = np.transpose(epoch_data_np, [0, 2, 1])
                    file_data.append((epoch_data_np, annotation))
                epoch_data = [[] for ch in channel_str]
                current_label = nxt_event_label
                if get_next_event(nxt_event_idx) != "END":
                    nxt_event_time, nxt_event_label = get_next_event(nxt_event_idx)
                    nxt_event_idx += 1
                else:
                    # nxt_event_time = time_annotations[len(time_annotations) - 1]
                    nxt_event_time = sys.float_info.max
                    nxt_event_idx += 1
            for j in range(len(channel_data)):
                ch = channel_data[j]
                epoch_data[j].append(ch[i])

        return file_data

    files = get_filenames(
        classes=classes, imagined=imagined, physical=physical, subjects=subjects
    )
    data: list[tuple[np.ndarray, physio.Labels]] = []
    channel_str = [c.value for c in channels]
    for filename, run, subject in files:
        raw_edf = mne.io.read_raw_edf(filename)
        mne.datasets.eegbci.standardize(raw_edf)
        montage = mne.channels.make_standard_montage("standard_1005")
        raw_edf.set_montage(montage)
        raw_edf.rename_channels(lambda x: x.strip("."))
        events, _ = mne.events_from_annotations(raw_edf)
        # print(events)
        raw_edf.pick_channels(channel_str)
        # TODO data preprocessing
        raw_data = raw_edf.get_data()

        event_times = [
            (ev[0] / raw_edf.info["sfreq"], physio.event_ref_to_event(ev[2], run))
            for ev in events
        ]
        channel_data = []
        time_annotations = []
        for spatial_channel in raw_data:
            spatial_channel = spatial_channel * (10 ** 6)  # Normalize data to uV
            bands, time_annotations = frequency_bands_muse(
                spatial_channel, raw_edf.info["sfreq"]
            )
            assert len(bands) == len(time_annotations)
            channel_data.append(bands)

        # Annotate frequency bands
        file_data = to_annotated_epochs(
            time_annotations, channel_data, event_times, channel_str
        )
        data = data + file_data

    # cut epochs such that they fit the window range

    max_timesteps = sys.float_info.max
    frequency = 10
    for epoch_data, anno in data:
        t = epoch_data.shape[2]
        if t < max_timesteps:
            max_timesteps = t
    max_time = max_timesteps / frequency
    if window_range < max_time:
        t_steps = int(window_range * frequency)
    else:
        t_steps = max_timesteps
    for i in range(len(data)):
        epoch_data, anno = data[i]
        cut = epoch_data[:, :, 0:t_steps]
        data[i] = (cut, anno)

    return data


def find_smallest_window_range(window_range, smw):
    if window_range is not None:
        if window_range > smw:
            return smw
        else:
            return window_range
    else:
        return smw


def fetch_physionet_data(
    classes: list[physio.Labels] = None,
    channels: list[physio.Channels] = None,
    imagined=True,
    physical=False,
    subjects: list[int] = None,
    window_range: float = None,
) -> list[tuple[np.ndarray, physio.Annotation]]:
    """
    @params
    window_range is in seconds
    @returns
    - list of epochs with corresponding annotation
    """

    # --------- filenames and loop preparation ---------
    files = get_filenames(
        classes=classes, imagined=imagined, physical=physical, subjects=subjects
    )
    channel_str = [c.value for c in channels]
    data = []
    # --------------------------------------------------

    for filename, run, subject in files:
        # ------------- edf file to RawEDF ------------------
        raw_edf = mne.io.read_raw_edf(filename)
        mne.datasets.eegbci.standardize(raw_edf)
        montage = mne.channels.make_standard_montage("standard_1005")
        raw_edf.set_montage(montage)
        raw_edf.rename_channels(lambda x: x.strip("."))
        # ---------------------------------------------------

        # ------------- RawEDF to epochs --------------------
        events, _ = mne.events_from_annotations(raw_edf)
        picks = mne.pick_types(
            raw_edf.info,
            meg=False,
            eeg=True,
            stim=False,
            eog=False,
            selection=channel_str,
        )

        smw = smallest_window_size(events, raw_edf)
        tmax = find_smallest_window_range(window_range, smw)

        # INSERT BANDPASS FILTER HERE
        # raw_edf.filter(l_freq=0.0, h_freq=0.0)

        epochs = mne.Epochs(
            raw_edf,
            events,
            preload=True,
            picks=picks,
            proj=False,
            reject_by_annotation=False,
            tmin=0.0,
            tmax=tmax,
            baseline=None,
        )
        # -----------------------------------------------

        # -------- epochs to desired data format --------
        epochs_data = epochs.get_data()
        for i in range(len(epochs_data)):
            assert len(epochs_data[i][0]) == len(epochs.times)
            annotation = physio.Annotation(
                run,
                physio.event_ref_to_event(events[i][2], run),
                epochs.times,
                subject,
                epochs.ch_names,
            )
            data.append((epochs_data[i], annotation))
    return data


def fetch_MI_data(
    channel_setting: physio.ChannelSettings,
    classes: list[physio.Labels],
    subjects: list[int],
    session_size: float,
    data_as_bands: bool = False,
):
    # -------- Choose fetch method ---------
    if data_as_bands:
        fetch_method = fetch_as_bands
    else:
        fetch_method = fetch_physionet_data
    # --------------------------------------

    # -------- Apply settings --------------
    if channel_setting is physio.ChannelSettings.MUSE:
        channels = [
            physio.Channels.AF7,
            physio.Channels.AF8,
            physio.Channels.T9,
            physio.Channels.T10,
        ]
    elif channel_setting is physio.ChannelSettings.CROWN:
        raise NotImplementedError("Please specify Crown's sensor locations")
    else:
        raise NotImplementedError("Please specify Crown's sensor locations")
    # --------------------------------------

    # ---------- fetch ---------------------
    data: list[tuple[np.ndarray, physio.Annotation]] = fetch_method(
        classes=classes,
        channels=channels,
        imagined=True,
        physical=False,
        subjects=subjects,
        window_range=session_size,
    )
    return data


"""
b: list[tuple[np.ndarray, physio.Annotation]] = fetch_as_bands(
    classes=[physio.Labels.BOTH_FISTS, physio.Labels.BOTH_FEETS],
    channels=[
        physio.Channels.AF7,
        physio.Channels.AF8,
        physio.Channels.T9,
        physio.Channels.T10,
    ],
    imagined=True,
    physical=False,
    subjects=[1],
    window_range=4.0,
)
print(len(b))
for epoch_data, annotation in b:
    print(epoch_data.shape)
#     print(epoch_data.shape)
"""

"""
# #############################################################################
# # Set parameters and read data

# avoid classification of evoked responses by using epochs that start 1s after
# cue onset.
tmin, tmax = -1., 4.
event_id = dict(hands=2, feet=3)
subject = 1
runs = [6, 10, 14]  # motor imagery: hands vs feet

# raw_fnames = eegbci.load_data(subject, runs)
raw_fnames = get_filenames()
raw = concatenate_raws([read_raw_edf(f, preload=True) for f in raw_fnames])
# eegbci.standardize(raw)  # set channel names
montage = make_standard_montage(standard_1020)
raw.set_montage(montage)

# strip channel names of "." characters
raw.rename_channels(lambda x: x.strip(.))

# Apply band-pass filter
raw.filter(7., 30., fir_design=firwin, skip_by_annotation=edge)

events, _ = events_from_annotations(raw, event_id=dict(T1=2, T2=3))

picks = pick_types(raw.info, meg=False, eeg=True, stim=False, eog=False,
                   exclude=bads)

# Read epochs (train will be done only between 1 and 2s)
# Testing will be done with a running classifier
epochs = Epochs(raw, events, event_id, tmin, tmax, proj=True, picks=picks,
                baseline=None, preload=True)
epochs_train = epochs.copy().crop(tmin=1., tmax=2.)
labels = epochs.events[:, -1] - 2
"""
