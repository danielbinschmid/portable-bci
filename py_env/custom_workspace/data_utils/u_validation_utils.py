import random
import numpy as np
import torch
import z_Physionet as physio
from n_CNN_LSTM import window_data
from enum import Enum, auto
from r_readphysionet import fetch_as_bands, fetch_physionet_data


def training_test_split(
    set_size: int, test_split: float = 0.1
) -> tuple[list[int], list[int]]:
    indeces = [i for i in range(set_size)]
    random.shuffle(indeces)
    training_size = int((1 - test_split) * set_size)
    training_indeces = []
    for i in range(training_size):
        training_indeces.append(indeces.pop())
    return training_indeces, indeces


def combine_dims(a, start=0, count=2):
    """ 
    Reshapes numpy array a by combining count dimensions, starting at dimension index start 
    """
    s = a.shape
    return np.reshape(a, s[:start] + (-1,) + s[start + count :])


def to_training_batches(
    data: list[tuple[np.ndarray, physio.Annotation]],
    training_split: list[int],
    batch_size: int,
    window_size: float,
    label_to_gt: dict,
) -> tuple[list[tuple[torch.Tensor, torch.Tensor]], list[int]]:
    """
    Fuses training split indeces and fetched data into training batches.

    @returns
    - list of (xbatch: Tensor, ybatch: Tensor) tuples
    - mutated training split
    """
    # print(len(training_split))
    remainder_batch_size = batch_size - len(training_split) % batch_size
    original_split = np.asarray(training_split).copy()
    for i in range(remainder_batch_size):
        x = random.choice(original_split)
        training_split.append(x)
    training_split_ = training_split.copy()
    num_training_events = len(training_split)
    assert num_training_events % batch_size == 0
    num_batches = int(num_training_events / batch_size)
    training_batches = []
    for batch_idx in range(num_batches):
        xbatch = []
        ybatch = []
        for event in range(batch_size):
            event_idx = training_split_.pop()
            event_data, annotation = data[event_idx]
            # fuse channels and frequency bands into one dimension
            event_data = combine_dims(event_data, start=0, count=2)
            # next, compute the mean => shape (channels * bands, num_windows)
            event_data = window_data(event_data, window_size=window_size, overlap=0.5)
            xbatch.append(event_data)
            ybatch.append(np.asarray(label_to_gt[annotation.label]))
        training_batches.append(
            (
                torch.from_numpy(np.asarray(xbatch)).float(),
                torch.from_numpy(np.asarray(ybatch)).type(torch.LongTensor),
            )
        )
    return training_batches, training_split


def validation_split_to_data(
    data, split: list[int], window_size: int, label_to_gt: dict
):
    validation_events = []
    split_ = split.copy()
    for v in split:
        x = []
        y = []
        event_idx = split_.pop()
        event_data, annotation = data[event_idx]
        # fuse channels and frequency bands into one dimension
        event_data = combine_dims(event_data, start=0, count=2)
        # next, compute the mean => shape (channels * bands, num_windows)
        event_data = window_data(event_data, window_size=window_size, overlap=0.5)
        x.append(event_data)
        y.append(np.asarray(label_to_gt[annotation.label]))
        validation_events.append(
            (
                torch.from_numpy(np.asarray(x)).float(),
                torch.from_numpy(np.asarray(y)).type(torch.LongTensor),
            )
        )
    return validation_events


def training_class_weights(
    training_split: list[int],
    data: list[tuple[np.ndarray, physio.Annotation]],
    label_to_gt: dict,
) -> torch.Tensor:
    total = len(training_split)
    weights = [0 for label in label_to_gt]
    for event_idx in training_split:
        data_, anno = data[event_idx]
        idx = int(label_to_gt[anno.label])
        weights[idx] += 1
    weights = np.asarray(weights) / total
    weights = torch.from_numpy(weights).float()
    return weights
