from cProfile import label
import matplotlib.pyplot as plt
import numpy as np
import plotting

plotting.prepare_for_latex()

dimThermometer = [75, 150, 369, 737]
dimSGD = [500, 1000, 2000, 5000, 10000]

EPFThermometer = [
    0.772 , 0.762 , 0.781 , 0.792
]
PhysionetThermometer = [
   0.612 , 0.618 , 0.619 , 0.617
]

EPFSGD = [
    0.743 , 0.747 , 0.75 , 0.756 , 0.776
]
PhysionetSGD = [
    0.625 , 0.634 , 0.632 , 0.633 , 0.633
]


import math
def p(X, labels, colors, linestyles, title, fig, ax, xti, xlabel, ylabel, labelloc=None, dimThermometer=[]):
    # Major ticks every 20, minor ticks every 5
    vals = np.concatenate((X[0], X[1]))

    ymin = int((np.min(vals) * 2 * 100)) / (2 * 100)
    ymax = math.ceil((np.max(vals) * 2 * 100)) / (2 * 100)
    ax.set_ylim(ymin, ymax)
    major_ticks_x = np.arange(ymin, ymax, 0.005)
    if len(major_ticks_x) > 3:
        major_ticks_x = np.arange(ymin, ymax, 0.01)
    minor_ticks_x = np.arange(ymin, ymax, 0.005)
    major_ticks_y = np.arange(0, 10001, 2000)
    y_ticks_labels = [str(ymin + (ymax - ymin) * i / 5) for i in major_ticks_y]
    ax.set_yticks(major_ticks_x)
    # ax.set_yticks(major_ticks_x)
    # ax.set_yticks(minor_ticks_x, minor=True)

    # ax.grid(which="minor", alpha=0.2)
    # ax.grid(which="major", alpha=0.5)
    ax.grid(alpha=0.125)
    y = np.arange(0, len(xti))
    maxSGD = xti[len(xti) - 1]

    isThermometer = lambda i: i == 0
    for i in range(len(X)):
        if isThermometer(i):
            y_ = [d * 10 for d in dimThermometer]
        else:
            y_ = xti
        x = X[i]
        ax.scatter(y_, x, s=10, color=colors[i])
        ax.plot(y_, x, ls=linestyles[i], color=colors[i], label=labels[i])

    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.set_xticklabels(major_ticks_y)
    ax.set_yticklabels(major_ticks_x)
    ax.set_title(title)
    labels = np.asarray(labels)

    lines = ax.get_lines()

    #vlegend1 = fig.legend([lines[i] for i in range(len(labels[0:-2]))], labels[0:-2], loc="upper left")
    # legend2 = fig.legend([lines[i] for i in range(len(labels[0:-2]), len(labels))],labels[-2:], loc="lower right")
    
    # leg1 = ax.legend([lines[i] for i in range(len(labels[0:-2]))], labels[0:-2], loc="upper left")
    # ax.legend([lines[i] for i in range(len(labels[0:-2]), len(labels))],labels[-2:], loc="lower right")
    if labelloc is not None:
        ax.legend(loc=labelloc)
    else:
        ax.legend()
    # ax.add_artist(leg1)
    # ax.add_artist(legend1)
    # ax.add_artist(legend2)


def main():
    fig, ax = plt.subplots()
    w, h = plotting.get_dimensions(125, 1, False)
    fig.set_size_inches(w, h)
    X = [np.asarray(EPFThermometer), np.asarray(EPFSGD)]
    # ["solid", "dashed", "dotted", "dashdot", "-", "--", "-.", ":"]
    labels =     ["Thermometer", "SGD"]
    colors =     ["purple", "orange"]
    linestyles = ["solid", "dashed"]

    p(X, labels, colors, linestyles, "", fig, ax, dimSGD, "", "Accuracy", None, dimThermometer)
    plt.savefig("dimHerscheEPF.pdf")
    
    fig, ax = plt.subplots()
    w, h = plotting.get_dimensions(125, 1, False)
    fig.set_size_inches(w, h)
    X = [np.asarray(PhysionetThermometer), np.asarray(PhysionetSGD)]
    labels =     ["Thermometer", "SGD"]
    colors =     ["purple", "orange"]
    linestyles = ["solid", "dashed"]
    p(X, labels, colors, linestyles, "", fig, ax, dimSGD, "Hyperdimension", "Accuracy", None, dimThermometer)
    plt.savefig("dimHerschePhysionet.pdf")
    


if __name__ == "__main__":
    main()




