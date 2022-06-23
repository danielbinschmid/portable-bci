import os

if __name__ == "__main__":
    import sys

    sys.path.append("../data_utils/")
    sys.path.append("../data_utils/custom_typing/")
    sys.path.append("../nn_utils/")

import datetime
from n_DeepConvNet import DeepConvNet
import numpy as np
import keras.optimizers
import keras.callbacks
from u_deepConvNetUtils import genShuffle,  get_data, validation_split, crop_trials, benchmark_subject, second_stage_fitting
import n_DeepConvNet as dcnn

if __name__ == "__main__":
    os.chdir("..")

# GLOBALS
NB_CHANNELS = 4
NB_CLASSES = 3
CLASS_VEC = [1, 2, 3]
SUBJECTS = range(1, 10)
OFFSET_TIME = 1.5
TIME_RANGE = 4.5
CROP_RANGE = 2
FREQUENCY = 128
BATCH_SIZE = 128


def pretrain_after_stopping():
    # ------------------------ CONFIG -------------------------
    nb_channels  = NB_CHANNELS
    nb_classes   = NB_CLASSES
    class_vec    = CLASS_VEC
    subjects     = SUBJECTS
    offset_time  = OFFSET_TIME
    time_range   = TIME_RANGE
    crop_range   = CROP_RANGE
    frequency    = FREQUENCY
    batch_size   = BATCH_SIZE
    lr = 1e-4
    epochs = 30
    early_stopping_patience = 4

    # paths
    experiment_ID            = "pretrain_DeepConvNet_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    global_dataset_path      = os.path.abspath(os.path.join(os.curdir, "data", "IV2a")) + "/"
    data_split_folderpath    = "./checkpoints/"
    shuffle_split_path       = data_split_folderpath + "shuffle.txt"
    training_split_path      = data_split_folderpath + "train_indeces.txt"
    validation_split_path    = data_split_folderpath + "validation_indeces.txt" 
    weight_path              = "./data/deepConvNet/weights/deepConvNet_train1_20220623-130450.h5"


    # ---------------------- TRAIN -------------------------------
    model = DeepConvNet(nb_classes=nb_classes, Chans=nb_channels)
    model.load_weights(weight_path)
    model.compile(optimizer=keras.optimizers.Adam(lr), loss='categorical_crossentropy', 
                metrics = ['accuracy'])

    train_data, train_labels                    = get_data(True, global_dataset_path, class_vec, subjects, time_range, offset_time, nb_classes)
    cropped_train_data, cropped_train_labels    = crop_trials(train_data, train_labels, frequency, crop_range, time_range)
    shuffle: np.ndarray                         = np.loadtxt(shuffle_split_path, delimiter=";").astype('int')
    cropped_train_data_, cropped_train_labels_  = cropped_train_data[shuffle, :, :], cropped_train_labels[shuffle]
    train_indeces, validation_indeces           = np.loadtxt(training_split_path, delimiter=";").astype('int'), np.loadtxt(validation_split_path, delimiter=";").astype('int')
    cropped_train_data, cropped_train_labels    = cropped_train_data_[train_indeces], cropped_train_labels_[train_indeces]
    val_trials                                  = (cropped_train_data_[validation_indeces], cropped_train_labels_[validation_indeces])

    # test model, before train accuracy
    for subject in subjects:
        print("///////////// BEFORE RETRAIN SUBJECT %s //////////////" %subject)
        test_data, test_labels = get_data(False, global_dataset_path, class_vec, [subject], time_range, offset_time, nb_classes)
        benchmark_subject(model, test_data, test_labels, frequency, crop_range, time_range)

    # after train
    second_stage_fitting((cropped_train_data, cropped_train_labels), val_trials, model, batch_size, experiment_ID, epochs, early_stopping_patience)

    # test model
    for subject in subjects:
        print("///////////// TEST SUBJECT %s //////////////" %subject)
        test_data, test_labels = get_data(False, global_dataset_path, class_vec, [subject], time_range, offset_time, nb_classes)
        benchmark_subject(model, test_data, test_labels, frequency, crop_range, time_range)


def pretrain():
    # ----------- CONFIG -----------
    nb_channels  = NB_CHANNELS
    nb_classes   = NB_CLASSES
    class_vec    = CLASS_VEC
    subjects     = SUBJECTS
    offset_time  = OFFSET_TIME
    time_range   = TIME_RANGE
    crop_range   = CROP_RANGE
    frequency    = FREQUENCY
    batch_size   = BATCH_SIZE

    epochs = 150
    epochs_after_stopping = 30
    lr = 1e-4
    early_stopping_patience = 8
    early_stopping_patience_after_stopping = 4

    global_dataset_path = os.path.abspath(os.path.join(os.curdir, "data", "IV2a")) + "/"
    experiment_ID = "pretrain_DeepConvNet_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    # ------------- DO -------------

    model = DeepConvNet(nb_classes=nb_classes, Chans=nb_channels)
    model.compile(optimizer=keras.optimizers.Adam(lr), loss='categorical_crossentropy', 
                metrics = ['accuracy'])


    # load training data and labels
    train_data, train_labels                    = get_data(True, global_dataset_path, class_vec, subjects, time_range, offset_time, nb_classes)
    cropped_train_data, cropped_train_labels    = crop_trials(train_data, train_labels, frequency, crop_range, time_range)
    shuffle                                     = genShuffle(cropped_train_data.shape[0])
    cropped_train_data_, cropped_train_labels_  = cropped_train_data[shuffle, :, :], cropped_train_labels[shuffle]
    train_indeces, validation_indeces           = validation_split(len(cropped_train_data), 0.25, save=True, shuffle=shuffle)
    cropped_train_data, cropped_train_labels    = cropped_train_data_[train_indeces], cropped_train_labels_[train_indeces]
    val_trials                                  = (cropped_train_data_[validation_indeces], cropped_train_labels_[validation_indeces])

    # init callbacks
    log_dir                 = "logs/fit/" + experiment_ID + "/pretrain_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    checkpoint_path         = "./checkpoints/{epoch:02d}-{val_loss:.2f}.hdf5"
    tensorboard_callback    = keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)
    early_stopping_callback = keras.callbacks.EarlyStopping('val_loss', patience=early_stopping_patience, restore_best_weights=True)
    cache_callback          = keras.callbacks.ModelCheckpoint(
        checkpoint_path,
        monitor="val_loss",
        verbose=0,
        save_best_only=False,
        save_weights_only=True,
        mode="auto",
        save_freq="epoch",
        options=None,
        initial_value_threshold=None,
    )
    callbacks = [tensorboard_callback, early_stopping_callback, cache_callback]
    
    # fit model
    history = model.fit(cropped_train_data, cropped_train_labels, batch_size=batch_size, epochs=epochs,verbose = 2,  callbacks=callbacks, validation_data=val_trials)
    model.save_weights("./deepConvNet_train1_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S") +".h5", overwrite=True)
    second_stage_fitting((cropped_train_data, cropped_train_labels), val_trials, model, batch_size, experiment_ID, epochs_after_stopping, early_stopping_patience_after_stopping)

    # test model
    for subject in subjects:
        print("///////////// TEST SUBJECT %s //////////////" %subject)
        test_data, test_labels = get_data(False, global_dataset_path, class_vec, [subject], time_range, offset_time, nb_classes)
        benchmark_subject(model, test_data, test_labels, frequency, crop_range, time_range)


def load_and_test():
    # ----------- CONFIG -----------
    nb_channels  = NB_CHANNELS
    nb_classes   = NB_CLASSES
    class_vec    = CLASS_VEC
    subjects     = SUBJECTS
    offset_time  = OFFSET_TIME
    time_range   = TIME_RANGE
    crop_range   = CROP_RANGE
    frequency    = FREQUENCY
    batch_size   = BATCH_SIZE
    lr = 1e-4

    global_dataset_path = os.path.abspath(os.path.join(os.curdir, "data", "IV2a")) + "/"
    # ------------- TEST -------------
    model = DeepConvNet(nb_classes=nb_classes, Chans=nb_channels)
    model.compile(optimizer=keras.optimizers.Adam(lr), loss='categorical_crossentropy', 
                metrics = ['accuracy'])
    model.load_weights("./data/deepConvNet/weights/deepConvNet_train2_20220623-182725.h5")

    avg = 0
    for subject in subjects:
        print("///////////// TEST SUBJECT %s //////////////" %subject)

        test_data, test_labels   = get_data(False, global_dataset_path, class_vec, [subject], time_range, offset_time, nb_classes)
        acc = benchmark_subject(model, test_data, test_labels, frequency, crop_range, time_range)
        avg += acc

    print("total acc: ")
    print(avg / len(subjects))




def finetune():
    # ----------- CONFIG -----------
    nb_channels  = NB_CHANNELS
    nb_classes   = NB_CLASSES
    class_vec    = CLASS_VEC
    subjects     = SUBJECTS
    offset_time  = OFFSET_TIME
    time_range   = TIME_RANGE
    crop_range   = CROP_RANGE
    frequency    = FREQUENCY
    batch_size   = BATCH_SIZE
    lr = 1e-5
    epochs = 50

    blocks_to_freeze = [dcnn.DeepConvNetBlock.BLOCK1_CONV, dcnn.DeepConvNetBlock.BLOCK2_CONV, dcnn.DeepConvNetBlock.BLOCK3_CONV]

    global_dataset_path = os.path.abspath(os.path.join(os.curdir, "data", "IV2a")) + "/"
    experiment_ID = "finetune_DeepConvNet_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    weight_path = "./data/deepConvNet/weights/deepConvNet_train2_20220623-182725.h5"

    get_log_dir = lambda subject: "logs/fit/" + experiment_ID + "/"  + str(subject) +  "/pretrain_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

    # ------------- TRAIN -------------
    model = DeepConvNet(nb_classes=nb_classes, Chans=nb_channels)
    model.load_weights(weight_path)
    dcnn.freezeBlocks(model, blocks=blocks_to_freeze)
    initial_weights = model.get_weights()

    avg = 0
    for subject in subjects:
        print("///////////// TEST SUBJECT %s //////////////" %subject)
        model.set_weights(initial_weights)
        model.compile(optimizer=keras.optimizers.Adam(lr), loss='categorical_crossentropy', 
                metrics = ['accuracy'])

        train_data, train_labels                 = get_data(True, global_dataset_path, class_vec, [subject], time_range, offset_time, nb_classes)
        cropped_train_data, cropped_train_labels = crop_trials(train_data, train_labels, frequency, crop_range, time_range)
        shuffle                                  = genShuffle(len(cropped_train_data))
        cropped_train_data, cropped_train_labels = cropped_train_data[shuffle], cropped_train_labels[shuffle]

        test_data, test_labels = get_data(False, global_dataset_path, class_vec, [subject], time_range, offset_time, nb_classes)
        test_data_cropped, test_labels_cropped = crop_trials(test_data, test_labels, frequency, crop_range, time_range)
        
        log_dir                = get_log_dir(subject)
        tensorboard_callback   = keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)
        callbacks              = [tensorboard_callback]
        history                = model.fit(cropped_train_data, cropped_train_labels, batch_size=batch_size, epochs=epochs, verbose=2, callbacks=callbacks, validation_data=(test_data_cropped,test_labels_cropped))
        
        acc = benchmark_subject(model, test_data, test_labels, frequency, crop_range, time_range)
        avg += acc

    print("total acc: ")
    print(avg / len(subjects))

if __name__ == "__main__":
    # pretrain()
    # genShuffle(100)
    #vload_and_test()
    # pretrain_after_stopping()
    finetune()