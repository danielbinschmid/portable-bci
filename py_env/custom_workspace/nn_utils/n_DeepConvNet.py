"""
Implementation is from https://github.com/vlawhern/arl-eegmodels
"""

from keras.models import Model
from keras.layers import Dense, Activation, Dropout
from keras.layers import Conv2D, MaxPooling2D
from keras.layers import BatchNormalization
from keras.layers import Input, Flatten
from keras.constraints import max_norm
from keras import backend as K
from enum import Enum, auto

def DeepConvNet(nb_classes, Chans=64, Samples=256, dropoutRate=0.5):
    """ Keras implementation of the Deep Convolutional Network as described in
    Schirrmeister et. al. (2017), Human Brain Mapping.
    
    This implementation assumes the input is a 2-second EEG signal sampled at 
    128Hz, as opposed to signals sampled at 250Hz as described in the original
    paper. We also perform temporal convolutions of length (1, 5) as opposed
    to (1, 10) due to this sampling rate difference. 
    
    Note that we use the max_norm constraint on all convolutional layers, as 
    well as the classification layer. We also change the defaults for the
    BatchNormalization layer. We used this based on a personal communication 
    with the original authors.
    
                      ours        original paper
    pool_size        1, 2        1, 3
    strides          1, 2        1, 3
    conv filters     1, 5        1, 10
    
    Note that this implementation has not been verified by the original 
    authors. 
    
    """

    # start the model
    input_main = Input((Chans, Samples, 1))
    block1 = Conv2D(
        25,
        (1, 5),
        input_shape=(Chans, Samples, 1),
        kernel_constraint=max_norm(2.0, axis=(0, 1, 2)),
    )(input_main)
    block1 = Conv2D(25, (Chans, 1), kernel_constraint=max_norm(2.0, axis=(0, 1, 2)))(
        block1
    )
    block1 = BatchNormalization(epsilon=1e-05, momentum=0.9)(block1)
    block1 = Activation("elu")(block1)
    block1 = MaxPooling2D(pool_size=(1, 2), strides=(1, 2))(block1)
    block1 = Dropout(dropoutRate)(block1)

    block2 = Conv2D(50, (1, 5), kernel_constraint=max_norm(2.0, axis=(0, 1, 2)))(block1)
    block2 = BatchNormalization(epsilon=1e-05, momentum=0.9)(block2)
    block2 = Activation("elu")(block2)
    block2 = MaxPooling2D(pool_size=(1, 2), strides=(1, 2))(block2)
    block2 = Dropout(dropoutRate)(block2)

    block3 = Conv2D(100, (1, 5), kernel_constraint=max_norm(2.0, axis=(0, 1, 2)))(
        block2
    )
    block3 = BatchNormalization(epsilon=1e-05, momentum=0.9)(block3)
    block3 = Activation("elu")(block3)
    block3 = MaxPooling2D(pool_size=(1, 2), strides=(1, 2))(block3)
    block3 = Dropout(dropoutRate)(block3)

    block4 = Conv2D(200, (1, 5), kernel_constraint=max_norm(2.0, axis=(0, 1, 2)))(
        block3
    )
    block4 = BatchNormalization(epsilon=1e-05, momentum=0.9)(block4)
    block4 = Activation("elu")(block4)
    block4 = MaxPooling2D(pool_size=(1, 2), strides=(1, 2))(block4)
    block4 = Dropout(dropoutRate)(block4)

    flatten = Flatten()(block4)

    dense = Dense(nb_classes, kernel_constraint=max_norm(0.5))(flatten)
    softmax = Activation("softmax")(dense)

    return Model(inputs=input_main, outputs=softmax)


class DeepConvNetBlock(Enum):
    BLOCK1_CONV   = auto()
    BLOCK2_CONV   = auto()
    BLOCK3_CONV   = auto()
    BLOCK4_CONV   = auto()
    BLOCK5_DENSE  = auto()

ALL_BLOCKS = [
    DeepConvNetBlock.BLOCK1_CONV, 
    DeepConvNetBlock.BLOCK2_CONV, 
    DeepConvNetBlock.BLOCK3_CONV, 
    DeepConvNetBlock.BLOCK4_CONV,
    DeepConvNetBlock.BLOCK5_DENSE
]

BLOCKS_DICT = {
    DeepConvNetBlock.BLOCK1_CONV: [
        "conv2d",
        "conv2d_1",
        "batch_normalization",
        "activation",
        "max_pooling2d",
        "dropout",
    ],
    DeepConvNetBlock.BLOCK2_CONV: [
        "conv2d_2",
        "batch_normalization_1",
        "activation_1",
        "max_pooling2d_1",
        "dropout_1",
    ],
    DeepConvNetBlock.BLOCK3_CONV: [
        "conv2d_3",
        "batch_normalization_2",
        "activation_2",
        "max_pooling2d_2",
        "dropout_2",
    ],
    DeepConvNetBlock.BLOCK4_CONV: [
        "conv2d_4",
        "batch_normalization_3",
        "activation_3",
        "max_pooling2d_3",
        "dropout_3",
    ],
    DeepConvNetBlock.BLOCK5_DENSE: ["flatten", "dense", "activation_4"]
}

def freezeBlocks(model: Model, blocks: list[DeepConvNetBlock]):
    for block in blocks:
        for layer in model.layers:
            if layer.name in BLOCKS_DICT[block]:
                layer.trainable = False


def unfreezeBlocks(model: Model, blocks: list[DeepConvNetBlock]):
    for block in blocks:
        for layer in model.layers:
            if layer.name in BLOCKS_DICT[block]:
                layer.trainable = True
