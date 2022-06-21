if __name__ == "__main__":
    import sys

    sys.path.append("./data_utils/")
    sys.path.append("./data_utils/custom_typing/")
    sys.path.append("./nn_utils/")

import datetime
import tensorflow as tf

import keras.callbacks
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
from keras import Model
import json
from keras.initializers import glorot_uniform  # Or your initializer of choice
import keras.backend as K



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


def fit_multiple_subjects(
        time_range: int, 
        offset_time, nb_samples: int, 
        nb_channels: int, nb_classes: int, 
        nb_epochs: int,
        benchmark_file: str, 
        class_vec: list,
        global_dataset_path: str, 
        subjects: list, 
        model: Model, 
        log_dir: str,
        initial_weights=None, 
        validation_data=None,
        validation_split=0.,
        early_stopping_callback=None):

    if initial_weights is not None:
        model.set_weights(initial_weights)

    # fetch training trials
    train_data, train_labels = ([], [])
    for subj in subjects:
        train_data_subj, train_labels_subj = IV2a.get_data(subj, True, global_dataset_path, class_vec=class_vec, trialtimerange= time_range, offset=offset_time)
        train_data, train_labels = (train_data + list(train_data_subj), train_labels + list(train_labels_subj))
    train_data, train_labels = (np.asarray(train_data), np.asarray(train_labels))

    # transform data
    train_labels = train_labels - 1
    train_labels = np_utils.to_categorical(train_labels, nb_classes)
    train_data = train_data.reshape((train_data.shape[0], nb_channels,nb_samples, 1))

    # train
    tensorboard_callback = keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)

    callbacks = [tensorboard_callback]
    if early_stopping_callback is not None:
        callbacks.append(early_stopping_callback)
    history = model.fit(train_data, train_labels, batch_size = 15, epochs = nb_epochs, verbose = 2, 
            validation_split=validation_split, validation_data=validation_data, callbacks=callbacks)

def validate_EEGNet_IV2a():
    # -------------- CONFIG ------------
    global_dataset_path = os.path.abspath(os.path.join(os.curdir, "data", "IV2a")) + "/"

    nb_classes = 3
    class_vec = [1, 2, 3]
    nb_channels = 4
    nb_epochs = 150
    nb_epochs_finetuning = 12
    subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9] # 1,2,3, 4, 5, 6, 7, 8, 9
    modes = ["naive-finetuning", "all_subjects", "individual"] # "naive-finetuning", "subject-blind-transfer", "individual"
    time_range = 4
    offset_time = 2
    nb_runs = 10

    target_frequency = 128
    nb_samples = int(time_range * target_frequency)
    benchmark_file = "IV2a_21-06_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

    # -------------- START --------------
    benchmark_data = {}

    for run in range(nb_runs):
        print("RUN %d"%run)
        run_accuracies = {}

        for mode in modes:
            print("MODE %s"%mode)
            mode_accuracies = {}
            model = EEGNet(nb_classes, nb_channels, nb_samples, dropoutRate = 0.5, kernLength = 32, F1 = 8, D = 2, F2 = 16, 
               dropoutType = 'Dropout')
            model.compile(loss='categorical_crossentropy', optimizer='adam', 
                    metrics = ['accuracy'])

            initial_weights = model.get_weights()

            # ------ TRAINING same for all subjects ----------
            if mode == "all_subjects":
                log_dir = "logs/fit/" + benchmark_file + "/" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
                fit_multiple_subjects(
                    time_range=time_range,
                    offset_time=offset_time,
                    nb_samples=nb_samples,
                    nb_channels=nb_channels,
                    nb_classes=nb_classes,
                    nb_epochs=nb_epochs,
                    benchmark_file=benchmark_file,
                    class_vec=class_vec,
                    global_dataset_path=global_dataset_path,
                    subjects=subjects,
                    model=model,
                    log_dir=log_dir,
                    initial_weights=initial_weights)
            # -----------------------------------------------

            
            for subject in subjects:
                print("///////////// SUBJECT %s //////////////" %subject)
                # new_weights = [glorot_uniform()(w.shape) for w in initial_weights]
                
                # -------- SUBJECT TEST DATA ----------
                test_data, test_labels   = IV2a.get_data(subject, False, global_dataset_path, class_vec=class_vec, trialtimerange= time_range, offset=offset_time)
                test_labels = test_labels - 1
                test_labels = np_utils.to_categorical(test_labels, nb_classes)
                test_data = test_data.reshape((test_data.shape[0], nb_channels,nb_samples, 1))

                # -------- SUBJECT SPECIFIC TRAINING ---------
                if mode != "subject-blind-transfer":
                    model.set_weights(initial_weights)
                    if mode == "naive-finetuning":

                        #  -------- fit model to all subjects except relevant one ---------
                        # fetch training trials
                        subjects_ = subjects.copy()
                        subjects_.remove(subject)
                        log_dir = "logs/fit/" + benchmark_file + "/pretrain_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

                        fit_multiple_subjects(
                            time_range=time_range,
                            offset_time=offset_time,
                            nb_samples=nb_samples,
                            nb_channels=nb_channels,
                            nb_classes=nb_classes,
                            nb_epochs=nb_epochs,
                            benchmark_file=benchmark_file,
                            class_vec=class_vec,
                            global_dataset_path=global_dataset_path,
                            subjects=subjects,
                            model=model,
                            log_dir=log_dir,
                            initial_weights=initial_weights,
                            validation_data=(test_data, test_labels))

                    if mode == "naive-finetuning" or mode == "individual":
                        # --------------------------- fine tune to relevant subject --------------------------
                        log_dir = "logs/fit/" + benchmark_file + "/" + "finetune_subj-" + str(subject) + "_run-" + str(run) + "_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
                        nb_epochs_ = nb_epochs_finetuning if mode == "naive-finetuning" else nb_epochs
                        initial_weights_ = None if mode == "naive-finetuning" else initial_weights
                        # valdiation_split_ = 0.25 if mode == "naive-finetuning" else 0.
                        # validation_data = None if mode == "naive-finetuning" else (test_data, test_labels)

                        # callback = keras.callbacks.EarlyStopping(monitor='accuracy', patience=3) 

                        fit_multiple_subjects(
                            time_range=time_range,
                            offset_time=offset_time,
                            nb_samples=nb_samples,
                            nb_channels=nb_channels,
                            nb_classes=nb_classes,
                            nb_epochs=nb_epochs_,
                            benchmark_file=benchmark_file,
                            class_vec=class_vec,
                            global_dataset_path=global_dataset_path,
                            subjects=[subject],
                            model=model,
                            log_dir=log_dir,
                            initial_weights=initial_weights_,
                            validation_data=(test_data, test_labels))
                        

                # --------------------------------------------

                # -------- SUBJECT SPECIFIC EVALUATION ---------
                probs           = model.predict(test_data)
                preds           = probs.argmax(axis = -1)  
                fold_accuracy   = np.mean(preds == test_labels.argmax(axis=-1))
                print("Classification accuracy: %f " % (fold_accuracy))
                mode_accuracies[subject] = fold_accuracy
                # ----------------------------------------------
                callback = tf.keras.callbacks.EarlyStopping(monitor='loss', patience=5)
                p = os.path.join("benchmarks" , benchmark_file, "run_" + str(run), mode + "_" "subj-" + str(subject) + "_" + "/")
                os.makedirs(p)
                with open(p + "accs" + '.json', 'w', encoding='utf-8') as f:
                    json.dump(mode_accuracies, f, ensure_ascii=False, indent=4)
                print("cached accs")

            run_accuracies[mode] = mode_accuracies

        benchmark_data["run_" + str(run)] = run_accuracies

    p = os.path.join("benchmarks", benchmark_file, "all_" + benchmark_file + ".json")
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(benchmark_data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    validate_EEGNet_IV2a()
