import os
if __name__ == "__main__":
    import sys
    os.chdir("..")
    os.chdir("..")
    sys.path.append("./data_utils/")
    sys.path.append("./data_utils/custom_typing/")
    sys.path.append("./nn_utils/")
# print(os.listdir("./data/musemotorimagery_reduced/left/3/"))
from r_readmuseMI import read_crops
import os
from n_EEGNet import EEGNet, EEGNetBlock, freezeBlocks, unfreezeBlock
import datetime
import numpy as np
from keras import utils as np_utils
import keras.callbacks
import random

def get_data(subjects, train_split=0.0, crop_size=4.0):
    trial_data, trial_labels, pretrain_data, pretrain_labels = [], [], [], []
    for subject in subjects:
        d, l, d_train, l_train = read_crops(subject, train_split=train_split, crop_session_size=crop_size)
        trial_data, trial_labels = trial_data + d, trial_labels + l
        pretrain_data, pretrain_labels = pretrain_data + d_train, pretrain_labels + l_train
    trial_data, trial_labels = np.asarray(trial_data), np.asarray(trial_labels)
    pretrain_data, pretrain_labels = np.asarray(pretrain_data), np.asarray(pretrain_labels)

    trial_labels = np_utils.to_categorical(trial_labels, 2)
    pretrain_labels = np_utils.to_categorical(pretrain_labels, 2)

    return trial_data, trial_labels, pretrain_data, pretrain_labels

def shuffle_indeces(n_trials: int):
    i = np.arange(0, n_trials)
    random.shuffle(i)
    return i

def eval():
    # ---------- CONFIG -----------
    nb_classes = 2
    nb_channels = 4
    nb_epochs = 50
    nb_epochs_finetuning = 25
    batch_size = 64

    frozenBlocks = [EEGNetBlock.BLOCK1_CONVPOOL, EEGNetBlock.BLOCK2_CONVPOOL]

    subjects = [2, 3, 4, 5]
    target_subjects = [2, 3, 4, 5]
    time_range = 2
    nb_runs = 10
    finetune_split = 0.5

    target_frequency = 128
    nb_samples = int(time_range * target_frequency)
    experiment_ID = "museMI_eegnetdefault_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    
    get_log_dir = lambda subject_and_mode: "logs/fit/" + experiment_ID + "/"  + str(subject_and_mode[0]) + "_" + subject_and_mode[1] +  "/pretrain_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

    accs = {}
    # --------- TRAIN --------
    for subject in target_subjects:
        print("-------- SUBJECT %d --------"%subject)
        subjects_ = subjects.copy()
        subjects_.remove(subject)

        pretrain_data, pretrain_labels, _, _ = get_data(subjects_, crop_size=time_range)
        shuffle = shuffle_indeces(len(pretrain_data))
        pretrain_data, pretrain_labels = pretrain_data[shuffle], pretrain_labels[shuffle]

        test_data_all, test_labels_all, _, _ = get_data([subject], train_split=0.0, crop_size=time_range)

        test_data, test_labels, finetune_data, finetune_labels = get_data([subject], train_split=finetune_split, crop_size=time_range)
        shuffle = shuffle_indeces(len(test_data))
        test_data, test_labels = test_data[shuffle], test_labels[shuffle]
        
        model = EEGNet(nb_classes, nb_channels, nb_samples)

        model.compile(loss='categorical_crossentropy', optimizer='adam', 
                    metrics = ['accuracy'])
        initial_weights = model.get_weights()


        # general training
        tensorboard_callback = keras.callbacks.TensorBoard(log_dir=get_log_dir((subject, "pretrain")), histogram_freq=1)
        callbacks = [tensorboard_callback]
        model.fit(pretrain_data, pretrain_labels, batch_size=batch_size, epochs=nb_epochs, verbose=2, callbacks=callbacks, validation_split=0.25, validation_data=(test_data_all, test_labels_all))

        
        # subject finetuning
        # check whether world is flipped
        probs           = model.predict(finetune_data)
        preds           = probs.argmax(axis = -1)  
        acc             = np.mean(preds == finetune_labels.argmax(axis=-1))
        if acc < 0.25:
            print("flip cause " + str(acc))
            finetune_labels = np.logical_xor(finetune_labels, 1)
            test_labels = np.logical_xor(test_labels, 1)

        freezeBlocks(model, frozenBlocks)
        tensorboard_callback = keras.callbacks.TensorBoard(log_dir=get_log_dir((subject, "finetune")), histogram_freq=1)
        callbacks = [tensorboard_callback]
        model.fit(finetune_data, finetune_labels, batch_size=batch_size, epochs=nb_epochs_finetuning, verbose=2, callbacks=callbacks, validation_split=0.25, validation_data=(test_data, test_labels))

        probs           = model.predict(test_data)
        preds           = probs.argmax(axis = -1)  
        acc             = np.mean(preds == test_labels.argmax(axis=-1))

        accs[subject] = acc

    print(accs)

if __name__ == "__main__":
    eval()

    

    