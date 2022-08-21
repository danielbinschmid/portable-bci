import os
if __name__ == "__main__":
    import sys
    os.chdir("..")
    sys.path.append("./data_utils/")
    sys.path.append("./data_utils/custom_typing/")
    sys.path.append("./nn_utils/")

import datetime
import tensorflow as tf
import tensorflowjs as tfjs
import keras.callbacks
from n_EEGNet import EEGNet
import numpy as np

import r_readIV2a as IV2a
from keras import utils as np_utils
from keras import Model
import json
import keras.backend as K



def fit_multiple_subjects(
        session: bool,
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
        train_data_subj, train_labels_subj = IV2a.get_data(subj, session, global_dataset_path, class_vec=class_vec, trialtimerange= time_range, offset=offset_time)
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
    class_vec_train = [1, 2, 3]
    class_vec_test = [1, 2, 3]
    nb_channels = 4
    nb_epochs = 150
    nb_epochs_finetuning = 8

    subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9] # 1,2,3, 4, 5, 6, 7, 8, 9
    time_range = 4
    offset_time = 2
    nb_runs = 1

    target_frequency = 128
    nb_samples = int(time_range * target_frequency)
    benchmark_file = "IV2a_layer-constrained-finetuning_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

    # -------------- START --------------
    benchmark_data = {}


    model = EEGNet(nb_classes, nb_channels, nb_samples, dropoutRate = 0.5, kernLength = 32, F1 = 8, D = 2, F2 = 16, 
        dropoutType = 'Dropout')
    model.compile(loss='categorical_crossentropy', optimizer='adam', 
            metrics = ['accuracy'])

    initial_weights = model.get_weights()


    avg = 0
    avg2 = 0
    for session in [True]:
        sessionID = "session_" + str(session)
        for subject in subjects:
            print("///////////// SUBJECT %s //////////////" %subject)
            model.set_weights(initial_weights)
            # new_weights = [glorot_uniform()(w.shape) for w in initial_weights]
            
            # -------- SUBJECT TEST DATA ----------
            test_data, test_labels   = IV2a.get_data(subject, not session, global_dataset_path, class_vec=class_vec_train, trialtimerange= time_range, offset=offset_time)
            test_labels = test_labels - 1
            test_labels = np_utils.to_categorical(test_labels, nb_classes)
            test_data = test_data.reshape((test_data.shape[0], nb_channels,nb_samples, 1))

            # -------- SUBJECT SPECIFIC TRAINING ---------
            #  -------- fit model to all subjects except relevant one ---------
            # fetch training trials
            subjects_ = subjects.copy()
            subjects_.remove(subject)
            log_dir = "logs/fit/" + benchmark_file + "/"+ sessionID +"_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

            fit_multiple_subjects(
                session=session,
                time_range=time_range,
                offset_time=offset_time,
                nb_samples=nb_samples,
                nb_channels=nb_channels,
                nb_classes=nb_classes,
                nb_epochs=nb_epochs,
                benchmark_file=benchmark_file,
                class_vec=class_vec_train,
                global_dataset_path=global_dataset_path,
                subjects=subjects_,
                model=model,
                log_dir=log_dir,
                initial_weights=initial_weights,
                validation_data=(test_data, test_labels)
            )
            model_save_path = os.path.join(os.curdir,"data", "EEGNet", "session2" ,str(subject)) + "/"
            os.makedirs(model_save_path)
            tfjs.converters.save_keras_model(model, model_save_path + sessionID + "/")

            # ----------------------------------------------


if __name__ == "__main__":
    validate_EEGNet_IV2a()