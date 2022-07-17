from math import cos, sin
from keras.models import Model
from keras.layers import Dense, Activation, Permute, Dropout, Add, Flatten, Lambda
from keras.layers import Conv2D, MaxPooling2D, AveragePooling1D
from keras.layers import SeparableConv2D, DepthwiseConv2D, MultiHeadAttention
from keras.layers import BatchNormalization, LayerNormalization
from keras.layers import SpatialDropout2D
from keras.regularizers import l1_l2
from keras.layers import Input, Flatten
from keras.constraints import max_norm
from keras import backend as K
import tensorflow as tf
from enum import Enum, auto
import numpy as np

def RiemannTransformerNet(nChannels, nFeats, nClasses):
    input1 = Input(shape=(nChannels,nFeats))
    # positional encoder
    sinoid = lambda i_v: sin(i_v[1]) if i_v[0] % 2 == 0 else cos(i_v[1])
    pos =tf.convert_to_tensor([[sinoid([f, c / pow(10000, (f - (f % 2)) / nFeats)]) for f in range(nFeats)] for c in range(nChannels)])
    # input1 = Add()([input1, pos])
    # layer normalization
    block1 = LayerNormalization()(input1)
    # multi head attention

    # block1 = Lambda((lambda x:x + pos))(block1)

    block1 = MultiHeadAttention(num_heads=8, key_dim=20)(block1, block1)

    # addition 
    block1 = Add()([input1, block1])

    # layer normalization
    block2= LayerNormalization()(block1)
    # dense layer 
    block2 = Dense(nFeats)(block2)
    # addition 
    block2 = Add()([block1, block2])

    block3 = Flatten()(block2)
    block3 = Dense(nClasses)(block3)
    softmax = Activation("softmax", name="softmax")(block3)
    return Model(inputs=input1, outputs=softmax)