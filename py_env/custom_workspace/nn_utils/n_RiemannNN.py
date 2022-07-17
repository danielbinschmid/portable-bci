from keras.models import Model
from keras.layers import Dense, Activation, Permute, Dropout, Flatten, Add
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
    nHiddenNeurons = 100# 10000 # 5000#  2000 # 500 # 250
    nOutHiddenNeurons = 10
    droprate = 0.5
    input1 = Input(shape=(nChannels, nFeats))

    block1 = Dense(nHiddenNeurons, name="d1")(input1)
    block1 = BatchNormalization()(block1)
    block1 = Activation("tanh")(block1)
    block1 = Dropout(droprate)(block1)

    
    block2 = Dense(nOutHiddenNeurons, name="d2")(block1)
    block2 = BatchNormalization()(block2)
    block2 = Activation("tanh")(block2)
    block2 = Dropout(droprate)(block2)

    block2 = Flatten()(block2)

  

    block3 = Dense(nClasses, name="d4")(block2)
    softmax = Activation("softmax", name="softmax")(block3)
    return Model(inputs=input1, outputs=softmax)


def freeze(net):
    layers = ["d1", "d2"]
    for layer in net.layers:
        if layer.name in layers:
            layer.trainable = False

def unfreeze(net):
    layers = ["d1", "d2"]
    for layer in net.layers:
        if layer.name in layers:
            layer.trainable = True