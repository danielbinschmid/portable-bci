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


def validate_EEGNet():
    # -------------- CONFIG ------------
    global_dataset_path = os.path.abspath(os.path.join(os.curdir, "data", "3classMI"))

    nb_classes = 3
    class_vec = [1, 2, 3]
    nb_channels = 4
    k_total = 4
    subjects = [1]
    time_range = 4.0
    nb_runs = 5


    ORIGINAL_FREQUENCY = 512
    target_frequency = 128
    downsample_factor = ORIGINAL_FREQUENCY / target_frequency
    nb_samples = int(time_range * target_frequency)
    modes = ["subject-adaptive"] # "subject-adaptive",  "subject-dependent", "subject-independent", 

    classes_id = ""
    for c in class_vec:
        classes_id = classes_id + "-" + str(c)
    benchmark_file = "eegnet-3classMI_" + classes_id + "_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

    # -------------- START --------------
    model = EEGNet(nb_classes, nb_channels, nb_samples, dropoutRate = 0.5, kernLength = 32, F1 = 8, D = 2, F2 = 16, 
               dropoutType = 'Dropout')
    
    model.compile(loss='categorical_crossentropy', optimizer='adam', 
              metrics = ['accuracy'])

    initial_weights = model.get_weights()

    benchmark_data = {}

    for mode in modes:
        print("///////////// MODE %s //////////////" %mode)
        mode_data = {}
        if mode == "subject-independent": # k-fold-cross validation is not needed for subject independent runs
            _k_total = 1
        else:
            _k_total = k_total

        for subject in subjects:
            print("///////////// SUBJECT %s //////////////" %subject)
            subject_accuracies = {}
            for k in range(_k_total):
                acc = 0
                for run in range(nb_runs):
                    print("RUN %d"%run)
                    # new_weights = [glorot_uniform()(w.shape) for w in initial_weights]
                    new_weights = initial_weights
                    model.set_weights(new_weights)
                    train_data, train_labels, test_data, test_labels = get_data(
                        global_dataset_path, subject, k, True, downsample_factor, mode=mode, class_vec=class_vec
                    ) # of shape (trials, channels, timesteps)
                    # convert data to NHWC (trials, channels, timesteps, kernels) format, kernel is 1
                    train_labels = train_labels - 1
                    test_labels = test_labels - 1
                    train_labels = np_utils.to_categorical(train_labels, nb_classes)
                    test_labels = np_utils.to_categorical(test_labels, nb_classes)
                    train_data = train_data.reshape((train_data.shape[0], nb_channels,nb_samples, 1))
                    test_data = test_data.reshape((test_data.shape[0], nb_channels,nb_samples, 1))

                    log_dir = "logs/fit/" +  "k-" + str(k) + "_subj-" + str(subject) + "_mode-" + mode + "_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
                    tensorboard_callback = keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)
                    history = model.fit(train_data, train_labels, batch_size = 15, epochs = 150, verbose = 2, 
                            validation_data=(test_data, test_labels), callbacks=[tensorboard_callback])
                    probs           = model.predict(test_data)
                    preds           = probs.argmax(axis = -1)  
                    fold_accuracy   = np.mean(preds == test_labels.argmax(axis=-1))
                    print("Classification accuracy: %f " % (fold_accuracy))
                    acc += fold_accuracy

                subject_accuracies["k_"+str(k)] = acc / nb_runs
            
            mode_data["subject_" + str(subject)] = subject_accuracies

            p = os.path.join(os.curdir, "benchmarks" , benchmark_file, mode, str(subject)) + "/"
            os.makedirs(p)
            with open(p + "accs" + '.json', 'w', encoding='utf-8') as f:
                json.dump(subject_accuracies, f, ensure_ascii=False, indent=4)

        benchmark_data[mode] = mode_data

    p = os.path.join("benchmarks", benchmark_file, "all_" + benchmark_file + ".json")
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(benchmark_data, f, ensure_ascii=False, indent=4)

def validate_EEGNet_IV2a():
    # -------------- CONFIG ------------
    global_dataset_path = os.path.abspath(os.path.join(os.curdir, "data", "IV2a")) + "/"

    nb_classes = 3
    class_vec = [1, 2, 3]
    nb_channels = 4
    nb_epochs = 150
    subjects = [1,2,3, 4, 5, 6, 7, 8, 9] # 1,2,3, 4, 5, 6, 7, 8, 9
    mode = "subject-blind-transfer" # "subject-dependent_no-transfer"
    time_range = 7.0
    nb_runs = 10

    target_frequency = 128
    nb_samples = int(time_range * target_frequency)
    benchmark_file = "IV2a_cross-subject-blind-transfer" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

    # -------------- START --------------
    model = EEGNet(nb_classes, nb_channels, nb_samples, dropoutRate = 0.5, kernLength = 32, F1 = 8, D = 2, F2 = 16, 
               dropoutType = 'Dropout')
    
    model.compile(loss='categorical_crossentropy', optimizer='adam', 
              metrics = ['accuracy'])

    initial_weights = model.get_weights()

    benchmark_data = {}

    for run in range(nb_runs):
        print("RUN %d"%run)

        # ------ SUBJECT INDEPENDENT TRAINING ----------
        if mode == "subject-blind-transfer":
            new_weights = initial_weights
            model.set_weights(new_weights)

            # fetch training trials
            train_data, train_labels = ([], [])
            for subj in subjects:
                train_data_subj, train_labels_subj = IV2a.get_data(subj, True, global_dataset_path, class_vec=class_vec)
                train_data, train_labels = (train_data + list(train_data_subj), train_labels + list(train_labels_subj))
            train_data, train_labels = (np.asarray(train_data), np.asarray(train_labels))

            # transform data
            train_labels = train_labels - 1
            train_labels = np_utils.to_categorical(train_labels, nb_classes)
            train_data = train_data.reshape((train_data.shape[0], nb_channels,nb_samples, 1))

            # train
            log_dir = "logs/fit/" + benchmark_file + "/" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
            tensorboard_callback = keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)
            history = model.fit(train_data, train_labels, batch_size = 15, epochs = nb_epochs, verbose = 2, 
                    callbacks=[tensorboard_callback])
        # -----------------------------------------------

        run_accuracies = {}
        for subject in subjects:
            print("///////////// SUBJECT %s //////////////" %subject)
            # new_weights = [glorot_uniform()(w.shape) for w in initial_weights]
            
            # -------- SUBJECT TEST DATA ----------
            test_data, test_labels   = IV2a.get_data(subject, False, global_dataset_path, class_vec=class_vec)
            test_labels = test_labels - 1
            test_labels = np_utils.to_categorical(test_labels, nb_classes)
            test_data = test_data.reshape((test_data.shape[0], nb_channels,nb_samples, 1))

            # -------- SUBJECT SPECIFIC TRAINING ---------
            if mode != "subject-blind-transfer":
                new_weights = initial_weights
                model.set_weights(new_weights)
                train_data, train_labels = IV2a.get_data(subject, True, global_dataset_path, class_vec=class_vec)
                # convert data to NHWC (trials, channels, timesteps, kernels) format, kernel is 1
                train_labels = train_labels - 1
                
                train_labels = np_utils.to_categorical(train_labels, nb_classes)
                
                train_data = train_data.reshape((train_data.shape[0], nb_channels,nb_samples, 1))

                log_dir = "logs/fit/" + benchmark_file + "/" + "subj-" + str(subject) + "_run-" + str(run) + "_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
                tensorboard_callback = keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)
                history = model.fit(train_data, train_labels, batch_size = 15, epochs = nb_epochs, verbose = 2, 
                        validation_data=(test_data, test_labels), callbacks=[tensorboard_callback])
            # --------------------------------------------

            # -------- SUBJECT SPECIFIC EVALUATION ---------
            probs           = model.predict(test_data)
            preds           = probs.argmax(axis = -1)  
            fold_accuracy   = np.mean(preds == test_labels.argmax(axis=-1))
            print("Classification accuracy: %f " % (fold_accuracy))
            run_accuracies[subject] = fold_accuracy
            # ----------------------------------------------
      
        p = os.path.join("benchmarks" , benchmark_file, str(run) + "/")
        os.makedirs(p)
        with open(p + "accs" + '.json', 'w', encoding='utf-8') as f:
            json.dump(run_accuracies, f, ensure_ascii=False, indent=4)

        benchmark_data["run_" + str(run)] = run_accuracies

    p = os.path.join("benchmarks", benchmark_file, "all_" + benchmark_file + ".json")
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(benchmark_data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    validate_EEGNet_IV2a()
