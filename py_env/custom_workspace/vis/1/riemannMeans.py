

import numpy as np
import matplotlib.pyplot as plt
import plotting

plotting.prepare_for_latex()

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
w, h = plotting.get_dimensions(300, 1)
fig.set_size_inches(w, h)
colors = ["orange", "red", "magenta", "green", "blue", "black", "purple", "grey", "cyan"]
linestyles = ["solid", "solid", ":", ":", "solid", ":", "solid", "solid", ":"]
scatterStyle = ["*", "v", "x", "d", ">", "+", "s", "p", "<"]

i = 0
labels = []
for key in runtimes:
    labels.append(key)
    ax.plot(nTrials, np.log(np.array(runtimes[key])), ls=linestyles[i], color=colors[i])
    ax.scatter(nTrials, np.log(np.array(runtimes[key])), marker=scatterStyle[i], label=key, color=colors[i])

    i += 1
ax.set_xlabel("Number of trials")
ax.set_ylabel(r"Milliseconds on logarithmic scale, $e^{x}$")
plt.grid(alpha=0.125)


#vlegend1 = fig.legend([lines[i] for i in range(len(labels[0:-2]))], labels[0:-2], loc="upper left")
# legend2 = fig.legend([lines[i] for i in range(len(labels[0:-2]), len(labels))],labels[-2:], loc="lower right")

# leg1 = ax.legend([lines[i] for i in range(len(labels[0:-2]))], labels[0:-2], loc="upper left")
# ax.legend([lines[i] for i in range(len(labels[0:-2]), len(labels))],labels[-2:], loc="lower right")
box = ax.get_position()
#ax.set_position([box.x0, box.y0, box.width * 0.3, box.height])

# Put a legend to the right of the current axis
ax.legend(loc='center left', bbox_to_anchor=(1, 0.5))
#ax.legend()
# ax.add_artist(leg1)

plt.savefig("riemannMeans.pdf")