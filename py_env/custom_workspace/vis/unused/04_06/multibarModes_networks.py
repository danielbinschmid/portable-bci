from load_data import load_for_modes
from folder_locs import HDC_LOC, MODE_IDS_HDC_3CLASS, THREE_CLASS_EEGNET, TWO_CLASS_EEGNET, MODE_IDS_HDC_2CLASS
import os
import numpy as np
import matplotlib.pyplot as plt

def multibar_table(X, shape, labels, title=""):
    """
    X of shape (modes, networks)
    shape is array with ["modes", "networks"]
    labels is dict
    """
    fig, ax = plt.subplots()
    ax.set_ylim([0.3, 1])
    width = 0.6
    ind = np.arange(len(X))
    X = X.T
    colors = []
    for i in range(len(X)):
        c = plt.cm.BuPu(np.linspace(0, 0.5, 5))[4 - i]
        rects = ax.bar(ind + (width / 3) * i, X[i], width / 3, color=c)
        colors.append(c)

    l =  lambda d: r"$\bf{%.4f}$" % round(d, 4) if d > 0.7 else "%.4f"% round(d, 4)
    cellText = [[l(network) for network in mode] for mode in X]
    colLabels = [mode for mode in labels[shape[0]]]

    rowLabels = [network for network in labels[shape[1]]]
    print(rowLabels)
    the_table = plt.table(
        cellText=cellText,
        rowLabels=[network for network in labels[shape[1]]],
        rowColours=colors,
        colLabels=colLabels,
        loc="bottom",
        cellLoc="center",
    )

    the_table.scale(1, 1.5)
    the_table.auto_set_font_size(False)
    the_table.set_fontsize(8)

    plt.subplots_adjust(left=0.2, bottom=0.2)

    ax.set_ylabel("Accuracy")
    ax.set_title(title)
    ax.set_xticks([])
    # ax.set_xticks(ind)
    # ax.set_xticklabels((d for d in dimensions))

    #  ax.legend((rects1[0], rects2[0]), ("EPF dataset", "physionet dataset"))

    plt.show()



def main():
    hdc_ids = [os.path.join(HDC_LOC, id) for id in MODE_IDS_HDC_3CLASS]
    data, shape, labels = load_for_modes(hdc_ids, THREE_CLASS_EEGNET)
    multibar_table(data, shape, labels, title="3 class prediction, EPF dataset")


    # hdc_ids = [os.path.join(HDC_LOC, id) for id in MODE_IDS_HDC_2CLASS]
    # data, shape, labels = load_for_modes(hdc_ids, TWO_CLASS_EEGNET)
    # multibar_table(data, shape, labels, title="2 class prediction, EPF dataset")

if __name__ == "__main__":
    main()