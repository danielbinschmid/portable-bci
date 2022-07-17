from cProfile import label
from unicodedata import name
import numpy as np
import matplotlib.pyplot as plt
runtimes = {
    "ALE": [
        4, 4462, 5705, 7548, 8690, 10436, 11856, 13011, 14208, 15852, 17537, 19071, 20752, 21742, 22651
    ],
    "Eucl": [
        3, 6, 6, 7, 8, 10, 10, 11, 15, 15, 14, 16, 16, 17, 18
    ],
    "Harmonic": [
        3, 74, 102, 123, 160, 171, 207, 253, 285, 264, 287, 316, 385, 384, 393
    ],
    "Identity": [
        4, 4, 6, 6, 8, 8, 8, 9, 10, 11, 11, 12, 12, 13, 14
    ],
    "Kullback": [
        4, 1057, 1093, 1123, 1161, 1177, 1234, 1272, 1279, 1266, 1314, 1320, 1359, 1974, 1890
    ],
    "LogDet": [
        4, 190, 289, 443, 499, 584, 513, 653, 1017, 1169, 1422, 1193, 1238, 1358, 1386
    ],
    "LogEucl": [
        4, 1128, 1597, 2083, 2451, 2948, 3411, 3786, 4276, 4725, 5257, 5583, 6079, 6698, 6983
    ],
    "Riemann": [
        4, 3629, 6252, 7774, 9032, 10039, 11033, 12389, 13568, 13851, 12649, 16824, 18062, 19173, 20477
    ],
    "Wasserstein": [
        4, 9609, 13680, 18671, 22144, 23229, 26961, 33411, 36958, 40302, 44128, 46073, 52132, 56221, 59409
    ]
}

nTrials = np.arange(1, 16)
fig, ax = plt.subplots()


for key in runtimes:
    ax.plot(nTrials, np.array(runtimes[key]) / 1000, label=key)
ax.set_xlabel("number of trials")
ax.set_ylabel("seconds")
plt.grid()
plt.legend()
plt.show()

