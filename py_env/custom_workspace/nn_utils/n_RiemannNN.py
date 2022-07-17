from keras.models import Model
from keras.layers import Dense, Activation, Permute, Dropout, Flatten
from keras.layers import Conv2D, MaxPooling2D, AveragePooling1D
from keras.layers import SeparableConv2D, DepthwiseConv2D
from keras.layers import BatchNormalization
from keras.layers import SpatialDropout2D
from keras.regularizers import l1_l2
from keras.layers import Input, Flatten
from keras.constraints import max_norm
from keras import backend as K
import tensorflow as tf
from enum import Enum, auto


def RiemannNet(nChannels, nFeats, nClasses):
    nHiddenNeurons = 100
    nOutHiddenNeurons = 10
    droprate = 0.5
    input1 = Input(shape=(nChannels, nFeats))

    block1 = Dense(nHiddenNeurons)(input1)
    block1 = BatchNormalization()(block1)
    block1 = Activation("tanh")(block1)
    block1 = Dropout(droprate)(block1)

    
    block2 = Dense(nOutHiddenNeurons)(block1)
    block2 = BatchNormalization()(block2)
    block2 = Activation("tanh")(block2)
    block2 = Dropout(droprate)(block2)


    block3 = Flatten()(block2)
    block3 = Dense(nClasses)(block3)
    softmax = Activation("softmax", name="softmax")(block3)
    return Model(inputs=input1, outputs=softmax)
