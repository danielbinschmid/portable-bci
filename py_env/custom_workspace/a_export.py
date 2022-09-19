if __name__ == "__main__":
    import sys

    sys.path.append("../../data_utils/")
    sys.path.append("../../data_utils/custom_typing/")
    sys.path.append("./nn_utils/")

import datetime
import tensorflow as tf
import tensorflowjs as tfjs
import keras.callbacks
import torch
import n_CNN_LSTM
from n_DeepConvNet import DeepConvNet
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
from r_read3classMI import N_SAMPLES, get_data
import os
from keras import utils as np_utils
import keras.backend as K
import json

from n_CNN_LSTM import OneDimCNNLSTM
from r_readphysionet import fetch_MI_data
import z_Physionet as physio
import numpy as np
from u_validation_utils import to_training_batches
import torch.nn
import torch
from torch.utils.mobile_optimizer import optimize_for_mobile

LABEL_TO_GT: dict[physio.Labels, np.ndarray] = {
    physio.Labels.BOTH_FEETS: np.asarray(0),
    physio.Labels.BOTH_FISTS: np.asarray(1),
}


def dummy_pretrained_cnn_lstm():
    classes = [physio.Labels.BOTH_FEETS, physio.Labels.BOTH_FISTS]
    data = fetch_MI_data(
        physio.ChannelSettings.MUSE,
        classes=classes,
        subjects=[1],
        session_size=3.9,
        data_as_bands=True,
    )
    channels = data[0][0].shape[0]
    bands = data[0][0].shape[1]
    batches, training_indeces = to_training_batches(
        data,
        [int(i) for i in range(len(data))],
        batch_size=43,
        window_size=0.6,
        label_to_gt=LABEL_TO_GT,
    )

    num_windows = batches[0][0].size(2)
    # Init network
    cnnlstm = OneDimCNNLSTM(
        num_classes=len(classes), input_size=channels * bands, num_windows=num_windows
    )
    # calibrate network
    cnnlstm.fit(
        batches,
        len(training_indeces),
        epochs=2000,
        learning_rate=0.0001,
        loss_func=torch.nn.NLLLoss(),
    )
    cnnlstm.eval()
    example = torch.rand(1, channels * bands, num_windows)
    traced_script_module = torch.jit.trace(cnnlstm, example)
    # optimized_traced_model = optimize_for_mobile(traced_script_module, backend='Vulkan')
    optimized_traced_model = optimize_for_mobile(traced_script_module)
    # optimized_traced_model._save_for_lite_interpreter("cnnlstm.ptl")

    """
    model = DebugModel()
    model.eval()
    example = torch.rand(1, 3, 224, 224)
    traced_script_module = torch.jit.trace(model, example)
    optimized_traced_model = optimize_for_mobile(traced_script_module, preserved_methods=["log"])
    optimized_traced_model._save_for_lite_interpreter("lite_model_2.ptl")
    """

def export_deepConvNet():
    # -------- CONFIG ---------
    n_classes = 3
    n_channels = 4
    n_samples = 256
    dropout_rate = 0.5

    weight_folder = "D:/bachelor-thesis/git/portable-bci/py_env/custom_workspace/checkpoints/39-0.70.hdf5"
    # -------------------------
    model = DeepConvNet(n_classes,n_channels, n_samples, dropout_rate)
    model.load_weights(weight_folder)
    model.compile(loss='categorical_crossentropy', optimizer='adam', 
              metrics = ['accuracy'])

    tfjs.converters.save_keras_model(model, "data/deepConvNet")    

def export_EEGNet():
    # -------------- CONFIG ------------
    global_dataset_path = os.path.abspath(os.path.join(os.curdir, "data", "3classMI"))

    nb_classes = 3
    class_vec = [1, 2, 3]
    nb_channels = 4
    time_range = 4.0


    ORIGINAL_FREQUENCY = 512
    target_frequency = 128
    downsample_factor = ORIGINAL_FREQUENCY / target_frequency
    nb_samples = int(time_range * target_frequency)

    # -------------- START --------------
    model = EEGNet(nb_classes, nb_channels, nb_samples, dropoutRate = 0.5, kernLength = 32, F1 = 8, D = 2, F2 = 16, 
               dropoutType = 'Dropout')
    
    model.compile(loss='categorical_crossentropy', optimizer='adam', 
              metrics = ['accuracy'])

    """
    train_data, train_labels, test_data, test_labels = get_data(
        global_dataset_path, 1, 1, True, downsample_factor, mode="all", class_vec=class_vec
    ) # of shape (trials, channels, timesteps)
    # convert data to NHWC (trials, channels, timesteps, kernels) format, kernel is 1
    train_labels = train_labels - 1
    train_labels = np_utils.to_categorical(train_labels, nb_classes)
    train_data = train_data.reshape((train_data.shape[0], nb_channels,nb_samples, 1))

    log_dir = "logs/fit/" +  "export_" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    tensorboard_callback = keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)
    history = model.fit(train_data, train_labels, batch_size = 15, epochs = 150, verbose = 2, 
            validation_data=(test_data, test_labels), callbacks=[tensorboard_callback])
    """
    tfjs.converters.save_keras_model(model, "data/EEGNet")
    # weights = model.get_weights()
    # weights = [w.tolist() for w in weights]
    # with open("data/EEGNet/weights.json", 'w', encoding='utf-8') as f:
    #     json.dump(weights, f)
    # model_config_json = model.to_json()
    # with open("data/EEGNet/config.json", 'w', encoding='utf-8') as f:
        # json.dump(model_config_json, f)
if __name__ == "__main__":
    # export_EEGNet()
    export_deepConvNet()