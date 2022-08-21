if __name__ == "__main__":
    import sys

    sys.path.append("./data_utils/")
    sys.path.append("./data_utils/custom_typing/")
    sys.path.append("./nn_utils/")

import datetime
import tensorflow as tf
import keras.callbacks
import torch
import n_CNN_LSTM
from n_EEGNet import EEGNet
import z_Physionet as physio
import numpy as np
from u_validation_utils import (
    training_test_split,
    to_training_batches,
    training_class_weights,
    validation_split_to_data,
)
from r_readphysionet import fetch_MI_data
import r_readmuse as muse
import z_Typing as z
from r_read3classMI import get_data
import r_readIV2a as IV2a
import os
from keras import utils as np_utils
import json
from keras.initializers import glorot_uniform  # Or your initializer of choice
import keras.backend as K

def validate_cnn_lstm_garcia(
    data: list[tuple[np.ndarray, z.Annotation]],
    classes: list[any],
    label_to_gt: dict[any, np.ndarray],
    window_size: float = 0.6,
    batch_size: int = None,
    learning_rate: float = 0.0005,
    epochs: int = 1500,
    validation_split: float = 0.1,
) -> tuple[list[float], list[float]]:
    """
    Trains the CNN + LSTM by Garcia-Moreno et al and yields training and validation losses.

    Paper: Garcia-Moreno, Francisco M., et al. 
    "Reducing response time in motor imagery using a headband and deep learning." Sensors 20.23 (2020): 6730. 
    on the physionet Motor Imagery data set

    Good results for 
    learning_rate=0.0001,
    epochs=5000
    & the training set as single batch

    @params:
        - data: list of events of recorded EEG data. Each element is a tuple of its data and its corresponding annotation.
        - classes: list of labels to consider. Useful when data contains multiple classes but a lower amount of classes is desired.
        - label_to_gt: Maps a label object to its ground truth class as numeric value that depicts the input to the loss function.
        - window_size: The high level window size that averages belonging frequency band windows
        - batch_size: Training batch size
        - learning_rate: Training learning rate
        - epochs: Number of epochs
        - validation_split: validation split as percentage

    @returns:
        A tuple (batch_losses, validation_losses)
    """
    raw_data_shape = data[0][0].shape
    training_split, validation_split = training_test_split(
        len(data), test_split=validation_split
    )
    validation_data = validation_split_to_data(
        data, validation_split, window_size=window_size, label_to_gt=label_to_gt
    )
    training_batches, training_split = to_training_batches(
        data=data,
        training_split=training_split,
        batch_size=batch_size,
        window_size=window_size,
        label_to_gt=label_to_gt,
    )
    num_training_events = len(training_split)
    if len(training_batches) == 0:
        raise ValueError("no training batches generated")
    preprocessed_data_shape: torch.Size = training_batches[0][0].size()
    num_windows = preprocessed_data_shape[2]
    lstm = n_CNN_LSTM.OneDimCNNLSTM(
        num_classes=len(classes),
        input_size=int(raw_data_shape[0] * raw_data_shape[1]),
        num_kernels=32,
        hidden_size=32,
        num_layers=2,
        num_windows=num_windows,
    )
    lstm.float()
    weights = training_class_weights(
        training_split=training_split, data=data, label_to_gt=label_to_gt
    )
    loss_func = torch.nn.NLLLoss(weights)
    batch_losses, validation_losses = lstm.fit(
        training_batches,
        num_training_events,
        epochs=epochs,
        learning_rate=learning_rate,
        loss_func=loss_func,
        validation_set=validation_data,
    )
    lstm.eval()
    return batch_losses, validation_losses


def validate_cnn_lstm_own_data(
    label_to_gt: dict[muse.Labels, np.ndarray],
    classes: list[muse.Labels] = [muse.Labels.LEFT_ARM, muse.Labels.RIGHT_ARM],
    session_size: float = 20.0,
    window_size: float = 0.6,
    batch_size: int = 36,
    learning_rate: float = 0.0005,
    epochs: int = 1500,
    validation_split: float = 0.1,
    test_split: float = 0.0,
):
    """
    Validates CNN+LSTM by Garcia-Moreno et al on own data.
    """
    if test_split > 0:
        raise NotImplementedError()
    data = muse.read_edf(session_size, [muse.Labels.LEFT_ARM, muse.Labels.RIGHT_ARM])
    batch_losses, validation_losses = validate_cnn_lstm_garcia(
        data,
        classes=classes,
        label_to_gt=label_to_gt,
        window_size=window_size,
        batch_size=batch_size,
        learning_rate=learning_rate,
        epochs=epochs,
        validation_split=validation_split,
    )
    return batch_losses, validation_losses


def validate_cnn_lstm(
    label_to_gt: dict[physio.Labels, np.ndarray] = {
        physio.Labels.BOTH_FEETS: np.asarray(0),
        physio.Labels.BOTH_FISTS: np.asarray(1),
    },
    channel_setting: physio.ChannelSettings = physio.ChannelSettings.MUSE,
    classes: list[physio.Labels] = [physio.Labels.BOTH_FISTS, physio.Labels.BOTH_FEETS],
    subjects: list[int] = [1],
    session_size: float = 4.0,
    window_size: float = 0.5,
    batch_size: int = 37,
    learning_rate: float = 0.0005,
    epochs: int = 1500,
    validation_split: float = 0.1,
    test_split: float = 0.0,
):
    """
    Validates CNN+LSTM by Garcia-Moreno et al on physionet data.
    """
    if test_split > 0.0:
        raise NotImplementedError("test pipeline not implemented yet")
    data = fetch_MI_data(
        channel_setting=channel_setting,
        classes=classes,
        subjects=subjects,
        session_size=session_size,
        data_as_bands=True,
    )
    if len(data) == 0:
        raise ValueError("No events in data found")
    batch_losses, validation_losses = validate_cnn_lstm_garcia(
        data,
        classes=classes,
        label_to_gt=label_to_gt,
        window_size=window_size,
        batch_size=batch_size,
        learning_rate=learning_rate,
        epochs=epochs,
        validation_split=validation_split,
    )
    """
    for test_idx in test_split:
        test_event, test_label = data[test_idx]
        test_event = combine_dims(test_event, start=0, count=2)
        test_event = onedcnn_lstm.window_data(test_event, window_size=0.5, overlap=0.5)
        test_batch = torch.from_numpy(np.expand_dims(test_event, axis=0)).float()
        y_hat = lstm.forward(test_batch).detach().cpu().numpy()
        print("%%")
        print("Ground truth: ")
        print(label_to_gt[test_label.label])
        print("Prediction: ")
        print(y_hat)
    """
    return batch_losses, validation_losses