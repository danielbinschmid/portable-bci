from cProfile import label
import matplotlib.pyplot as plt
import numpy as np
import plotting

plotting.prepare_for_latex()

proportions_full = [0, 0.05, 0.1, 0.15, 0.2, 0.5]
proportions_short = [0.05, 0.1, 0.15, 0.2, 0.5]

crossSubjectOnlineHRR = [
    0.4990031294384847,
    0.5365042650616236,
    0.5552744835873441,
    0.5824499405919888,
    0.6278085356852631,
]
onlineEEGNet = [
    0.622136066899638,
    0.6420105814712623,
    0.6620613577493439,  # [0.6027407081460598,
    0.6890595517662566,
    0.784361938097891,
]
onlineSVM = [
    0.5153624968145875,
    0.5550237059148994,
    0.5733639404072656,
    0.5841909600714836,
    0.6300239579260106,
]
onlineLDA = [
    0.4928201452943629,
    0.5417798387359442,
    0.5617947155874994,
    0.5748189983513134,
    0.6168293950210512,
]
onlineFNN = [
    0.4940916134193722,
    0.5447415854995944,
    0.5631832936098461,
    0.5818676817073289,
    0.6379127230727558,
]

onlineThermometer = [
    0.4897923446315658,
    0.5307050386456793,
    0.5546989071626396,
    0.5715253528442519,
    0.6079181119714986,
]
onlineEEGNetHDC = [
    0.5386978613258384,
    0.5778654587220439,
    0.6079350725606337,
    0.6279254683802368,
    0.6728338988944272,
]


def p(X, labels, colors, linestyles, title, fig, ax, ylim, ylabel):
    # Major ticks every 20, minor ticks every 5

    major_ticks_x = np.arange(0, 1, 0.05)
    minor_ticks_x = np.arange(0, 1, 0.025)
    major_ticks_y = np.arange(0, len(X[0]), 1)

    ax.set_xticks(major_ticks_y)
    ax.set_yticks(major_ticks_x)
    ax.set_yticks(minor_ticks_x, minor=True)
    ylim_min, ylim_max = ylim
    ax.set_ylim(ylim_min, ylim_max)
    ax.grid(which="minor", alpha=0.05)
    ax.grid(which="major", alpha=0.125)
    y = np.arange(0, len(X[0]))
    for i in range(len(X)):
        x = X[i]
        ax.scatter(y, x, s=10, color=colors[i])
        ax.plot(y, x, ls=linestyles[i], color=colors[i])

    ax.set_xlabel("Training set percentage")
    ax.set_ylabel(ylabel)
    ax.set_xticklabels(proportions_short)
    yticklabels = [int(x * 100) / 100 for x in major_ticks_x]
    ax.set_yticklabels(yticklabels)
    ax.set_title(title)
    labels = np.asarray(labels)

    lines = ax.get_lines()
    #vlegend1 = fig.legend([lines[i] for i in range(len(labels[0:-2]))], labels[0:-2], loc="upper left")
    # legend2 = fig.legend([lines[i] for i in range(len(labels[0:-2]), len(labels))],labels[-2:], loc="lower right")
    
    leg1 = ax.legend([lines[i] for i in range(len(labels[0:-2]))], labels[0:-2], loc="upper left")
    ax.legend([lines[i] for i in range(len(labels[0:-2]), len(labels))],labels[-2:], loc="lower right")

    ax.add_artist(leg1)
    # ax.add_artist(legend1)
    # ax.add_artist(legend2)

import math
def main():
    fig, ax = plt.subplots()
    w, h = plotting.get_dimensions(220, 1, True)
    fig.set_size_inches(w, h)
    X = [onlineEEGNet, onlineSVM, onlineFNN, onlineEEGNetHDC]
    # ["solid", "dashed", "dotted", "dashdot", "-", "--", "-.", ":"]
    labels =     ["EEGNet", "SVM", "FNN", "EEGNet+HDC"]
    colors =     ["purple", "green", "black", "brown"]
    linestyles = ["solid", "dashed", "dashdot", "dotted"]

    miny =  int(np.min(np.array(X).flatten()) * 2 * 10)  / (10*2)
    maxy = math.ceil(np.max(np.array(X).flatten()) * 2 * 10)  / (10*2)
    p(X, labels, colors, linestyles, "", fig, ax, (miny, maxy), "Accuracy")
    plt.savefig("onlineCalibr.pdf")

    fig, ax = plt.subplots()
    w, h = plotting.get_dimensions(220, 1, True)
    fig.set_size_inches(w, h)
    X = [crossSubjectOnlineHRR, onlineSVM, onlineLDA, onlineFNN, onlineThermometer]

    labels =     ["HRR", "SVM", "LDA", "FNN", "HDC-thermometer"]
    colors =     ["red", "green", "orange", "black", "brown"]
    linestyles = ["solid", "dashed", "dotted", "dashdot", "-."]

    miny =  int(np.min(np.array(X).flatten()) * 2 * 10)  / (10*2)
    maxy = math.ceil(np.max(np.array(X).flatten()) * 2 * 10)  / (10*2)
    p(X, labels, colors, linestyles, "", fig, ax, (miny, maxy), "")

    plt.savefig("onlineCalibrRiemann.pdf")

if __name__ == "__main__":
    main()
