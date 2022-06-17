import sys

sys.path.append("./data_utils/")
sys.path.append("./data_utils/custom_typing/")
sys.path.append("./nn_utils/")


import z_Physionet as physio
import numpy as np
from a_benchmark import validate_cnn_lstm, validate_cnn_lstm_own_data
import r_readmuse as muse
import matplotlib.pyplot as plt
from a_export import dummy_pretrained_cnn_lstm
from r_readphysionet import export_as_numpy

LABEL_TO_GT: dict[physio.Labels, np.ndarray] = {
    physio.Labels.BOTH_FEETS: np.asarray(0),
    physio.Labels.BOTH_FISTS: np.asarray(1),
}
channel_settings = physio.ChannelSettings.MUSE
classes = [physio.Labels.BOTH_FISTS, physio.Labels.BOTH_FEETS]
subjects = [1]
session_size = 4.0
window_size = 0.5


def cnnlstm():
    batch_losses, validation_losses = validate_cnn_lstm(
        label_to_gt=LABEL_TO_GT,
        channel_setting=channel_settings,
        classes=classes,
        subjects=subjects,
        session_size=session_size,
        window_size=window_size,
        batch_size=38,
        learning_rate=0.0001,
        epochs=5000,
        validation_split=0.1,
    )
    np.savetxt("batch_losses.gz", np.asarray(batch_losses), delimiter=",")
    # np.savetxt("validation_losses.gz", np.asarray(validation_losses), delimiter=",")
    plt.plot(batch_losses, label="training loss")
    # plt.plot(validation_losses, label = "validation loss")
    plt.draw()
    plt.savefig("batch_losses.png")


def cnnlstm_own_data():
    LABEL_TO_GT = {muse.Labels.LEFT_ARM: 0, muse.Labels.RIGHT_ARM: 1}
    batch_losses, val_losses = validate_cnn_lstm_own_data(LABEL_TO_GT)
    np.savetxt("batch_losses.gz", np.asarray(batch_losses), delimiter=",")
    np.savetxt("validation_losses.gz", np.asarray(val_losses), delimiter=",")
    plt.plot(batch_losses, label="training loss")
    plt.plot(val_losses, label="validation loss")
    plt.show()


def load():
    subject_data = np.load("./data/physionet/1_data.npy")
    subject_labels = np.load("./data/physionet/1_labels.npy")
    print(np.mean(subject_data))
    print(subject_labels.shape)


def tensorflowtest():
    import tensorflow

    print(tensorflow.__version__)


if __name__ == "__main__":
    # cnnlstm_own_data()
    # cnnlstm()
    # dummy_pretrained_cnn_lstm()
    tensorflowtest()
    # load()
