import numpy as np
import scipy.signal
from enum import Enum, auto


def smallest_window_size(events: np.ndarray, raw_edf) -> float:
    """
    Returns the smallest window size within the run
    """
    times = raw_edf.times
    lens_events = []
    for i in range(len(events)):
        if i < len(events) - 1 and events[i][2] != 2:
            lens_events.append(times[events[i + 1][0]] - times[events[i][0]])
    lens_events.append(times[raw_edf.last_samp] - times[events[len(events) - 1][0]])
    return min(lens_events)


class FrequencyBandTypes(Enum):
    WELCH = auto()
    MUSE = auto()


def bandpower_welch(x, fs: int, fmin: int, fmax: int, time):

    # f, Pxx = scipy.signal.periodogram(x, fs=fs)
    f, Pxx = scipy.signal.welch(x, fs, nperseg=fs * time)
    ind_min = np.argmax(f > fmin) - 1
    ind_max = np.argmax(f >= fmax)
    return np.trapz(Pxx[ind_min:ind_max], f[ind_min:ind_max])


def bandpower_muse(x, fs, fmin, fmax):
    """
    Called with x with a time range of ~ 1.1636 seconds
    """
    # print("%%%")
    f, Pxx = scipy.signal.periodogram(x, fs=fs)
    # print("fmin: " + str(fmin))
    # print("fmax: " + str(fmax))
    # print(Pxx)
    # print("last f: " + str(f[len(f) - 1]))
    ind_min = np.argmax(f > fmin) - 1
    ind_max = np.argmax(f > fmax) - 1
    sum = 0
    # print("ind_min:" + str(ind_min))
    # print("ind_max: " + str(ind_max))
    for i in range(ind_min, ind_max + 1):
        sum += Pxx[i]
    # print(sum)
    if sum == 0:
        raise ValueError("zero-valued frequency band")
    return np.log10(sum)


def frequency_bands_muse(x: np.ndarray, fs):
    """
    This method will return a frequency band time series of 10 Hz

    256 samples over a frequency of 220Hz, thus ~ 1.1636 seconds

    Overlap is 22 samples over the 220 Hz frequency, thus 0.1 seconds overlap
    """

    def compute_bandpowers(current_start: int, current_end: int):
        delta = bandpower_muse(x[current_start:current_end], fs, 0.5, 4)
        theta = bandpower_muse(x[current_start:current_end], fs, 4, 8)
        alpha = bandpower_muse(x[current_start:current_end], fs, 8, 12)
        beta = bandpower_muse(x[current_start:current_end], fs, 12, 30)
        gamma = bandpower_muse(x[current_start:current_end], fs, 30, 90)
        return [delta, theta, alpha, beta, gamma]

    time_alignments = []
    bands = []
    time = 256 / 220
    # time = 2
    step_size_in_time = 0.1
    window_width = int(time * fs)
    step_size = step_size_in_time * fs
    assert window_width < len(x)
    current_start = 0
    current_end = window_width
    time_alignments.append(time / 2)
    bands.append(compute_bandpowers(current_start, current_end))
    while current_end + step_size < len(x):
        current_start = current_start + step_size
        current_end = current_end + step_size
        b = compute_bandpowers(int(current_start), int(current_end))
        bands.append(b)
        time_alignments.append(
            time_alignments[len(time_alignments) - 1] + step_size_in_time
        )
    # print("GGGGGG")
    # print(len(x))
    # print(step_size_in_time)
    # print(step_size)
    # print(window_width)
    return bands, time_alignments


def frequency_bands_welch(data: np.ndarray, fs) -> dict[str, float]:
    """
    delta (0.5–4 Hz), theta (4–8 Hz), alpha (8–12 Hz), beta (12–30 Hz), and gamma (30–100 Hz).

    @params
        - data: of shape (time_points)
        - fs: recoding frequency of signal in Hz
    """
    # two times the period of lowest frequency, 0.5Hz is lowest frequency
    time = 2 / 0.5
    result: dict[str, float] = {}
    result["delta"] = bandpower_welch(data, fs, 0.5, 4, time)
    result["theta"] = bandpower_welch(data, fs, 4, 8, time)
    result["alpha"] = bandpower_welch(data, fs, 8, 12, time)
    result["beta"] = bandpower_welch(data, fs, 12, 30, time)
    result["gamma"] = bandpower_welch(data, fs, 30, fs / 2 - 0.0001, time)
    return result


"""
256 samples for each frequency representation
90 % overlap for next window, shifting of 22 samples https://web.archive.org/web/20181105231756/http://developer.choosemuse.com/tools/available-data#Absolute_Band_Powers
"""
