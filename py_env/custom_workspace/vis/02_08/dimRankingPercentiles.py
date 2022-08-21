import matplotlib.pyplot as plt
import numpy as np
import plotting

plotting.prepare_for_latex()

def multibar_table(X, Y, refAcc, title=""):
    """
    X of shape (modes, networks)
    shape is array with ["modes", "networks"]
    labels is dict
    """
    fig, ax = plt.subplots()
    w, h = plotting.get_dimensions(200,1)
    fig.set_size_inches(w, h)
    ax.set_ylim([0.61, 0.635])
    yticks = np.arange(0.61, 0.636, 0.005)
    width = 0.6
    # ax.grid(alpha=0.35)
    ind = np.arange(len(X))
    color = plt.cm.BuPu(np.linspace(0, 0.5, 5))[2]

    colors = plt.cm.magma(np.linspace(0, 1, 100))
    a_colors = [colors[99 - int((acc - 0.61) * 40 * 100)] for acc in X]

    print(ind)
    rect = ax.bar(ind, X, width, align="center", color=a_colors)

    plt.axhline(y=refAcc, linestyle="dashed", color="black")

    l = lambda d: r"$\bf{%.4f}$" % round(d, 4) if d > 0.7 else "%.4f" % round(d, 4)

    ax.set_ylabel("Accuracy")
    ax.set_xlabel("Percentiles")
    ax.set_title(title)
    ax.set_xticks(ind, Y)
    ax.set_yticklabels(yticks)
    # ax.set_xticks(ind)
    # ax.set_xticklabels((d for d in dimensions))
    plt.savefig("dimRankingPercentiles.pdf")
    #  ax.legend((rects1[0], rects2[0]), ("EPF dataset", "physionet dataset"))



def main():
    percentiles = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]

    ref_acc = 0.6161841728631995
    accs = [
        0.6261677090678229,
        0.6287468465924166,
        0.6309702849364814,
        0.6298588098723634,
        0.62785739169974,
        0.6262468560130534,
        0.6240269161938021,
        0.621977144322124,
        0.6197481827536108,
        0.6185260948886299,
        0.6177846171477873,
    ]

    multibar_table(
        accs, percentiles, ref_acc, "Dimension ranking percentiles accuracy benchmark"
    )
    fig, ax = plt.subplots()

    ax.plot()


if __name__ == "__main__":
    main()
