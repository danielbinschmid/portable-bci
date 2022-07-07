import os
if __name__ == "__main__":
    import sys
    os.chdir("..")
    sys.path.append("./data_utils/")
    sys.path.append("./data_utils/custom_typing/")
    sys.path.append("./nn_utils/")

import datetime
import random
import tensorflow as tf

import keras.callbacks
from n_EEGNet import EEGNet, EEGNetBlock, freezeBlocks
import numpy as np

import r_readIV2a as IV2a
from keras import utils as np_utils
from keras import Model
import json
from tqdm.keras import TqdmCallback

class DataHandler:
    def __init__(self, global_dataset_path, class_vec, time_range, offset_time, nb_samples, nb_channels) -> None:
        self.global_dataset_path = global_dataset_path
        self.class_vec = class_vec
        self.time_range = time_range
        self.offset_time = offset_time
        self.nb_samples = nb_samples
        self.nb_channels = nb_channels


    def getdata(self, training: bool, subjects):
        nb_classes = len(self.class_vec)

        # fetch training trials
        train_data, train_labels = ([], [])
        for subj in subjects:
            train_data_subj, train_labels_subj = IV2a.get_data(subj, training, self.global_dataset_path, class_vec=self.class_vec, trialtimerange= self.time_range, offset=self.offset_time)
            train_data, train_labels = (train_data + list(train_data_subj), train_labels + list(train_labels_subj))
        train_data, train_labels = (np.asarray(train_data), np.asarray(train_labels))

        # transform data
        train_labels = train_labels - 1
        train_labels = np_utils.to_categorical(train_labels, nb_classes)
        train_data = train_data.reshape((train_data.shape[0], self.nb_channels, self.nb_samples, 1))
        return train_data, train_labels


def gen_random_indeces(l) -> list[int]:
    indeces: np.ndarray = np.arange(0, l)
    random.shuffle(indeces)
    return indeces.tolist()

def get_cycle_indeces(proportion, nCycles, rand_indeces):
    n_trials = len(rand_indeces)
    n_cycle_trials = int(proportion * n_trials)
    cycle_start = lambda cycleIdx: cycleIdx * n_cycle_trials if cycleIdx * n_cycle_trials + n_cycle_trials < n_trials else n_trials - n_cycle_trials

    cycles_finetune = [[rand_indeces[i] for i in range(cycle_start(cycleIdx), cycle_start(cycleIdx) + n_cycle_trials)] for cycleIdx in range(0, nCycles)]
    cycles_benchmark = [[rand_indeces[i] for i in range(0, n_trials) if i not in np.arange(cycle_start(cycleIdx), cycle_start(cycleIdx) + n_cycle_trials)] for cycleIdx in range(0, nCycles)]
    return cycles_finetune, cycles_benchmark


def fit_data(
        train_data, 
        train_labels,
        nb_epochs: int,
        model: Model, 
        log_dir: str,
        initial_weights=None, 
        validation_data=None,
        validation_split=0.,
        early_stopping_callback=None):

    if initial_weights is not None:
        model.set_weights(initial_weights)

    # train
    tensorboard_callback = keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)

    callbacks = [tensorboard_callback] # TqdmCallback(verbose=0)
    if early_stopping_callback is not None:
        callbacks.append(early_stopping_callback)
    history = model.fit(train_data, train_labels, batch_size = 15, epochs = nb_epochs, verbose = 0, 
            validation_split=validation_split, validation_data=validation_data, callbacks=callbacks)


def validate_EEGNet_IV2a():
    # -------------- CONFIG ------------
    global_dataset_path = os.path.abspath(os.path.join(os.curdir, "data", "IV2a")) + "/"

    nb_classes = 3
    class_vec = [1, 2, 3]
    nb_channels = 4
    nb_epochs = 150
    nb_epochs_finetuning = 12
    
    frozenBlocks = [EEGNetBlock.BLOCK1_CONVPOOL, EEGNetBlock.BLOCK2_CONVPOOL]
    
    configCycles = [
        {"proportion": 0.05, "n_cycles": 10 },
        {"proportion": 0.1, "n_cycles": 10 },
        {"proportion": 0.15, "n_cycles": 8 },
        {"proportion": 0.2, "n_cycles": 5 },
        {"proportion": 0.5, "n_cycles": 2 },
    ]

    subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9] # 1,2,3, 4, 5, 6, 7, 8, 9
    time_range = 4
    offset_time = 2
    nb_runs = 10

    target_frequency = 128
    nb_samples = int(time_range * target_frequency)
    benchmark_file = "crossSessionSecondSession_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

    datahandler = DataHandler(global_dataset_path, class_vec, time_range, offset_time, nb_samples, nb_channels)

    # -------------- START --------------
    benchmark_data = {}

    for run in range(nb_runs):
        print("RUN %d"%run)
        run_id = "run_" + str(run)
        benchmark_data[run_id] = {}

        model = EEGNet(nb_classes, nb_channels, nb_samples, dropoutRate = 0.5, kernLength = 32, F1 = 8, D = 2, F2 = 16, 
            dropoutType = 'Dropout')
        model.compile(loss='categorical_crossentropy', optimizer='adam', 
                metrics = ['accuracy'])

        initial_weights = model.get_weights()

        for subject in subjects:
            print("///////////// SUBJECT %s //////////////" %subject)
            subject_id = "subj_" + str(subject)
            benchmark_data[run_id][subject_id] = {}

            for is_first_session_train in [False]: 
                session_id = "session_" + str(is_first_session_train)
                benchmark_data[run_id][subject_id][session_id] = {}

                model.set_weights(initial_weights)

                # -------- SUBJECT TEST DATA ----------
                test_data, test_labels = datahandler.getdata(not is_first_session_train, [subject])

                # -------- SUBJECT SPECIFIC TRAINING ---------
                #  -------- fit model to all subjects except relevant one ---------
                subjects_ = subjects.copy()
                subjects_.remove(subject)
                log_dir = "logs/fit/" + benchmark_file + "/pretrain_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

                train_data, train_labels = datahandler.getdata(is_first_session_train, subjects_)

                fit_data(train_data, train_labels, nb_epochs, model, log_dir, initial_weights, (test_data, test_labels))

                # --------------------------- fine tune to relevant subject --------------------------
                log_dir = "logs/fit/" + benchmark_file + "/" + "finetune_subj-" + str(subject) + "_run-" + str(run) + "_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
                nb_epochs_ = nb_epochs_finetuning
                initial_weights_ = None

                subj_finetune_data, subj_finetune_labels = datahandler.getdata(True, [subject])

                fit_data(
                    train_data=subj_finetune_data,
                    train_labels=subj_finetune_labels,
                    nb_epochs=nb_epochs_finetuning,
                    model=model,
                    log_dir=log_dir,
                    initial_weights=initial_weights_,
                    validation_data=(test_data, test_labels)
                )

                # -------- SUBJECT SPECIFIC EVALUATION ---------
                probs           = model.predict(test_data)
                preds           = probs.argmax(axis = -1)  
                fold_accuracy   = np.mean(preds == test_labels.argmax(axis=-1))
                print("Classification accuracy before session finetuning: %f " % (fold_accuracy))
                benchmark_data[run_id][subject_id][session_id]["before_session_finetuning"] = fold_accuracy

                subj_finetuned_weights = model.get_weights()

                shuffled_indeces = gen_random_indeces(test_data.shape[0])
                freezeBlocks(model, frozenBlocks)

                for configCycle in configCycles:
                    train_cycle_indeces, benchmark_cycle_indeces = get_cycle_indeces(configCycle["proportion"], configCycle["n_cycles"], shuffled_indeces)
                    cycle_id = "proportion_" + str(configCycle["proportion"])

                    cycle_accs = []
                    for cycleIdx in range(0, len(train_cycle_indeces)):
                        sesh_finetune_data, sesh_finetune_labels = test_data[train_cycle_indeces[cycleIdx]], test_labels[train_cycle_indeces[cycleIdx]]
                        sesh_test_data, sesh_test_labels = test_data[benchmark_cycle_indeces[cycleIdx]], test_labels[benchmark_cycle_indeces[cycleIdx]]

                        log_dir = "logs/fit/" + benchmark_file + "/" + "subj-" + str(subject) + "_finetune-sesh_" + "proportion-" + str(configCycle["proportion"]) + "_cycle-" + str(cycleIdx) + "_run-" + str(run) + "_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
                        model.set_weights(subj_finetuned_weights)
                        fit_data(
                            sesh_finetune_data, 
                            sesh_finetune_labels, 
                            nb_epochs=nb_epochs_finetuning, 
                            model=model, 
                            log_dir=log_dir, 
                            initial_weights=subj_finetuned_weights, 
                            validation_data=(sesh_test_data, sesh_test_labels) 
                        )
                        # -------- SUBJECT SPECIFIC EVALUATION ---------
                        probs           = model.predict(test_data)
                        preds           = probs.argmax(axis = -1)  
                        fold_accuracy   = np.mean(preds == test_labels.argmax(axis=-1))
                        print("Classification accuracy after session finetuning: %f " % (fold_accuracy))
                        cycle_accs.append(fold_accuracy)
                    benchmark_data[run_id][subject_id][session_id][cycle_id] = cycle_accs

                    p = os.path.join("benchmarks" , benchmark_file, "run_" + str(run), session_id, "subj-" + str(subject), cycle_id + "/")
                    os.makedirs(p)
                    with open(p + "accs" + '.json', 'w', encoding='utf-8') as f:
                        json.dump(benchmark_data, f, ensure_ascii=False, indent=4)

        benchmark_data["run_" + str(run)] = benchmark_data[run_id]

    p = os.path.join("benchmarks", benchmark_file, "all_" + benchmark_file + ".json")
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(benchmark_data, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    validate_EEGNet_IV2a()