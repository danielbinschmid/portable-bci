from audioop import reverse
from statistics import mean
from turtle import color
import matplotlib.pyplot as plt
import numpy as np
from load_benchmarks_hersche import load, dim_vs_subject_mtrx
from HDCtype import HDCtype


def heatmap(
    X=None,
    dimensions=[],
    subjects=[],
    xaxisname="dimension",
    yaxisname="subject",
    title="accuracy",
):
    """
    Dimension against subject for accuracy

    @params
    - X (ndarray): shape (n_dim, n_subjects)
    - dimensions: shape (n_dim)
    - subjects: shape (n_subjects)
    """
    # accuracies = np.ones((len(dimensions), len(subjects)))
    accuracies = X

    fig, ax = plt.subplots()
    im = ax.imshow(accuracies, cmap="bone", vmin=0.5, vmax=1)
    plt.colorbar(im)

    # Show all ticks and label them with the respective list entries
    ax.set_xticks(np.arange(len(subjects)), labels=subjects)
    ax.set_yticks(np.arange(len(dimensions)), labels=dimensions)

    # Rotate the tick labels and set their alignment.
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")

    # Loop over data dimensions and create text annotations.
    for i in range(len(subjects)):
        for j in range(len(dimensions)):
            text = ax.text(
                i,
                j,
                "%.2f" % round(accuracies[j, i], 2),
                ha="center",
                va="center",
                color="w",
            )

    ax.set_title(title)
    fig.tight_layout()
    plt.show()


def barplot():
    data = [
        [66386, 174296, 75131, 577908, 32015],
        [58230, 381139, 78045, 99308, 160454],
        [89135, 80552, 152558, 497981, 603535],
        [78415, 81858, 150656, 193263, 69638],
        [139361, 331509, 343164, 781380, 52269],
    ]

    columns = ("Freeze", "Wind", "Flood", "Quake", "Hail")
    rows = ["%d year" % x for x in (100, 50, 20, 10, 5)]

    values = np.arange(0, 2500, 500)
    value_increment = 1000

    # Get some pastel shades for the colors
    colors = plt.cm.BuPu(np.linspace(0, 0.5, len(rows)))
    n_rows = len(data)

    index = np.arange(len(columns)) + 0.3
    bar_width = 0.4

    # Initialize the vertical-offset for the stacked bar chart.
    y_offset = np.zeros(len(columns))

    # Plot bars and create text labels for the table
    cell_text = []
    for row in range(n_rows):
        plt.bar(index, data[row], bar_width, bottom=y_offset, color=colors[row])
        y_offset = y_offset + data[row]
        cell_text.append(["%1.1f" % (x / 1000.0) for x in y_offset])
    # Reverse colors and text labels to display the last value at the top.
    colors = colors[::-1]
    cell_text.reverse()

    # Add a table at the bottom of the axes
    the_table = plt.table(
        cellText=cell_text,
        rowLabels=rows,
        rowColours=colors,
        colLabels=columns,
        loc="bottom",
    )

    # Adjust layout to make room for the table:
    plt.subplots_adjust(left=0.2, bottom=0.2)

    plt.ylabel("Loss in ${0}'s".format(value_increment))
    plt.yticks(values * value_increment, ["%d" % val for val in values])
    plt.xticks([])
    plt.title("Loss by Disaster")

    plt.show()


def barplot2(X, dimensions):
    """
    X is of shape (n_dim, n_subjects)
    """
    n_subject = X.shape[1]
    n_dim = X.shape[0]

    ind = np.arange(n_subject)  # the x locations for the groups
    width = 0.8  # the width of the bars
    group_width = n_dim * width

    fig = plt.figure()
    ax = fig.add_subplot(111)
    rects = [None for i in range(n_dim)]
    for dim in range(n_dim):
        print(X[dim])
        rects[dim] = ax.bar(
            ind + (width / n_dim) * dim,
            X[dim],
            width / n_dim,
            color=(0.2 + (0.1 * dim), 0.2 + (0.1 * dim), 0.5),
        )

    # add some
    ax.set_ylabel("Accuracy")
    ax.set_title("Accuracy by subject")
    ax.set_xticks(ind + width / 2)
    ax.set_xticklabels((subject for subject in range(X.shape[1])))

    ax.legend(
        (rects[i][0] for i in range(n_dim)),
        ("dimension %d" % dim for dim in dimensions),
    )

    plt.show()


def barplot3(X, X2, svm):
    n_subject = X.shape[1]
    n_dim = X.shape[0]

    ind = np.arange(n_subject)  # the x locations for the groups
    width = 0.6  # the width of the bars
    group_width = n_dim * width

    fig = plt.figure()
    ax = fig.add_subplot(111)
    d = [np.mean(X[:, subj]) for subj in range(X.shape[1])]
    d2 = [np.mean(X2[:, subj]) for subj in range(X2.shape[1])]
    d3 = svm

    rects1 = ax.bar(ind, d, width / 3, color=(0.2, 0.2, 0.5))
    rects2 = ax.bar(ind + (width / 3), d2, width / 3, color=(0.5, 0.5, 0.5))
    rects3 = ax.bar(ind + (width / 3) * 2, d3, width / 3, color=(0.8, 0.8, 0.5))
    # add some
    ax.set_ylabel("Accuracy")
    ax.set_title("Accuracy by subject")
    ax.set_xticks(ind)
    ax.set_xticklabels((subject for subject in range(X.shape[1])))

    ax.legend((rects1[0], rects2[0], rects3[0]), ("HDC thermometer", "HDC-SGD", "svm"))

    plt.show()


def model_multibar_subjects(X, model_names=[]):
    """
    X is list of models
    model is of shape (n_subjects)
    """
    n_models = len(X)
    n_subjects = len(X[0])
    fig, ax = plt.subplots()
    ax.set_ylim([0.3, 1])
    width = 0.6
    ind = np.arange(n_subjects)

    colors = plt.cm.BuPu(np.linspace(0.3, 0.6, n_models + 1))
    rects = []

    for model in range(n_models):
        rect = ax.bar(
            ind + (width / n_models) * model,
            X[model],
            width / n_models,
            color=colors[model],
        )
        rects.append(rect)

    l = lambda x: "%.3f" % round(x, 3)
    cellText = [[l(acc) for acc in model] for model in X]
    colLabels = [str(subj) for subj in range(n_subjects)]
    the_table = plt.table(
        cellText=cellText,
        rowLabels=model_names,
        rowColours=colors,
        colLabels=colLabels,
        loc="bottom",
        cellLoc="center",
    )

    the_table.scale(1, 1.5)

    # the_table.set_fontsize(25)

    # Adjust layout to make room for the table:
    plt.subplots_adjust(left=0.2, bottom=0.2)

    ax.set_ylabel("Accuracy")
    ax.set_title("Accuracy for dimensions")
    ax.set_xticks([])
    # ax.set_xticks(ind)
    # ax.set_xticklabels((d for d in dimensions))

    #  ax.legend((rects1[0], rects2[0]), ("EPF dataset", "physionet dataset"))

    plt.show()


def p():
    # --------- CONFIG -----------
    N_SUBJECTS = 5  # 5, 38
    BENCHMARK_PATH = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/3classMI/results/"

    modes = ["subject-adaptive", "subject-independent", "subject-dependent"]
    

if __name__ == "__main__":
    p()
