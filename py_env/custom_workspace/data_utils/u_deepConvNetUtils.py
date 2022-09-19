if __name__ == "__main__":
    import sys

    sys.path.append("../../data_utils/")
    sys.path.append("../../data_utils/custom_typing/")
    sys.path.append("../nn_utils/")

import datetime
from tqdm import tqdm
import r_readIV2a as IV2a
import numpy as np
import keras.optimizers
import keras.callbacks
from keras import utils as np_utils
import random

def genShuffle(datasetSize: int):
    indeces = np.arange(0, datasetSize)
    random.shuffle(indeces)
    return indeces

def validation_split(datasetSize: int, validation_split: float, save: bool=False, shuffle=None):
    indeces = np.arange(0, datasetSize)
    random.shuffle(indeces)

    validation_indeces = indeces[0:int(validation_split * len(indeces))]
    train_indeces = indeces[int(validation_split * len(indeces)):len(indeces)]

    if save:
        np.savetxt("./checkpoints/train_indeces.txt", train_indeces, delimiter=";")
        np.savetxt("./checkpoints/validation_indeces.txt", validation_indeces, delimiter=";")
        np.savetxt("./checkpoints/shuffle.txt", shuffle, delimiter=";")
    return train_indeces, validation_indeces

def crop_trials(trial_data, trial_labels, frequency, crop_range, time_range):
    # crop trials
    cropped_train_data, cropped_train_labels = ([], [])
    for trialIdx in range(trial_labels.shape[0]):
        trialLabel = trial_labels[trialIdx]
        trialData = trial_data[trialIdx] # of shape (channels, time)

        virtual_time_idx = 0
        crop_size = frequency * crop_range
        total_size = frequency * time_range

        while virtual_time_idx + crop_size < total_size:
            crop_data = trialData[:, virtual_time_idx:virtual_time_idx+crop_size]
            virtual_time_idx += 1
            cropped_train_data.append(crop_data)
            cropped_train_labels.append(trialLabel)


    cropped_train_data, cropped_train_labels = (np.asarray(cropped_train_data), np.asarray(cropped_train_labels))
    return cropped_train_data, cropped_train_labels


def get_data(training: bool, global_dataset_path, class_vec, subjects, time_range, offset_time, nb_classes):
    # load training data and labels
    train_data, train_labels = ([], [])
    for subj in subjects:
        train_data_subj, train_labels_subj = IV2a.get_data(subj, training, global_dataset_path, class_vec=class_vec, trialtimerange= time_range, offset=offset_time)
        train_data, train_labels = (train_data + list(train_data_subj), train_labels + list(train_labels_subj))
    train_data, train_labels = (np.asarray(train_data), np.asarray(train_labels))

    train_labels = train_labels - 1
    train_labels = np_utils.to_categorical(train_labels, nb_classes)

    return train_data, train_labels

def benchmark_subject(model, test_data, test_labels, frequency, crop_range, time_range):
    # crops
    # crop trials
    nCorrects = 0
    for trialIdx, i in enumerate(tqdm(range(test_labels.shape[0]))):
        trialLabel = test_labels[trialIdx]
        trialData = test_data[trialIdx] # of shape (channels, time)

        cropped_test_data, _ = crop_trials(np.asarray([trialData]), np.asarray([trialLabel]), frequency, crop_range, time_range)

        # -------- SUBJECT SPECIFIC EVALUATION ---------
        probs           = model.predict(cropped_test_data, verbose=0)
        preds           = probs.argmax(axis = -1)  
        prediction = np.asarray([list(preds).count(i) for i in range(3)]).argmax(axis=-1)
        nCorrects += prediction == trialLabel.argmax(axis=-1)
        

    acc = nCorrects / test_labels.shape[0]
    print("Classification accuracy: %f " % (acc))
    return acc


def second_stage_fitting(cropped_train, val_trials, model, batch_size=128, experiment_ID="default", epochs=30, early_stopping_patience=4):
    # second stage fitting
    cropped_train_data, cropped_train_labels = cropped_train
    validation_data, validation_labels = val_trials
    train_data = np.concatenate((cropped_train_data, validation_data))
    train_labels = np.concatenate((cropped_train_labels, validation_labels))

    log_dir = "logs/fit/" + experiment_ID + "/finetune_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    tensorboard_callback = keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)

    early_stopping_callback = keras.callbacks.EarlyStopping('val_loss', patience=early_stopping_patience, restore_best_weights=True)
    callbacks = [tensorboard_callback, early_stopping_callback]
    history = model.fit(train_data, train_labels, batch_size=batch_size, epochs=epochs, verbose=2, callbacks=callbacks, validation_data=val_trials)

    model.save_weights("./deepConvNet_train2_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S") +".h5", overwrite=True)