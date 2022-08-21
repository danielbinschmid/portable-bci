import numpy as np
import matplotlib.pyplot as plt
from HDCtype import HDCtype
from load_benchmarks_hersche import load, dim_vs_subject_mtrx, merge


def multibar_minmax_std_table(dimensions, X1, X2, title=""):
    d1 = [np.mean(dim) for dim in X1]
    lsmall = lambda d: "%.3f" % round(d, 3)
    l = (
        lambda d: r"$\mu =$ "
        + lsmall(np.mean(d))
        + r"$\in [$"
        + lsmall(np.min(d))
        + ", "
        + lsmall(np.max(d))
        + "]"
    )
    d1str = [l(dim) for dim in X1]
    std1 = [
        [-1 * (np.min(dim) - np.mean(dim)) for dim in X1],
        [np.max(dim) - np.mean(dim) for dim in X1],
    ]
    d2 = [np.mean(dim) for dim in X2]
    d2str = [l(dim) for dim in X2]
    std2 = [
        [-1 * (np.min(dim) - np.mean(dim)) for dim in X2],
        [np.max(dim) - np.mean(dim) for dim in X2],
    ]

    fig, ax = plt.subplots()
    ax.set_ylim([0.3, 1])
    width = 0.6
    ind = np.arange(len(dimensions))
    c1 = plt.cm.BuPu(np.linspace(0, 0.5, 5))[4]
    c2 = plt.cm.BuPu(np.linspace(0, 0.5, 5))[3]
    rects1 = ax.bar(ind, d1, width / 2, color=c1, yerr=std1)
    rects2 = ax.bar(ind + width / 2, d2, width / 2, color=c2, yerr=std2)  # , yerr=std2

    # ax2 = ax.twinx()
    # ax2.boxplot([dim for dim in X1])
    # ax2.set_ylim(ax.get_ylim())

    # Add a table at the bottom of the axes

    cellText = [d1str, d2str]
    colLabels = [str(d) for d in dimensions]
    the_table = plt.table(
        cellText=cellText,
        rowLabels=["EPF dataset", "Physionet dataset"],
        rowColours=[c1, c2],
        colLabels=colLabels,
        loc="bottom",
        cellLoc="center",
    )

    the_table.scale(1, 1.5)
    the_table.auto_set_font_size(False)
    the_table.set_fontsize(8)

    """
    cellDict = the_table.get_celld()
    for i in range(0,len(colLabels)):
        cellDict[(0,i)].set_height(.07)
        for j in range(1,len(cellText)+1):
            cellDict[(j,i)].set_height(0.06)
            """

    # the_table.set_fontsize(25)

    # Adjust layout to make room for the table:
    plt.subplots_adjust(left=0.2, bottom=0.2)

    ax.set_ylabel("Accuracy")
    ax.set_title(title)
    ax.set_xticks([])
    # ax.set_xticks(ind)
    # ax.set_xticklabels((d for d in dimensions))

    #  ax.legend((rects1[0], rects2[0]), ("EPF dataset", "physionet dataset"))

    plt.show()


def bar_thermometer_dim_datasets_accuracy():
    # --------- CONFIG -----------
    TYPES = [HDCtype.THERMOMETER, HDCtype.SGD]
    DIMS = {
        HDCtype.THERMOMETER: [75, 150, 369, 737],
        HDCtype.SGD: [500, 1000, 2000, 5000, 10000],
    }
    N_SUBJECTS = 5  # 5, 38
    # BENCHMARK_PATH = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/physionet/bfe-vs-bfi_CP34FC34/dataresult/physionet_FC_CP_34"
    BENCHMARK_PATH = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/3classMI/results/3classMI_256Hz_4ch"
    BENCHMARK_PATH_ = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/3classMI/results/4ch_b"

    # xxxxxxxxxxxxxx DATASET2 xxxxxxxxxxxxxx
    N_SUBJECTS_2 = 38  # 5, 38
    BENCHMARK_PATH_2 = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/physionet/bfe-vs-bfi_CP34FC34/dataresult/physionet_FC_CP_34"
    # ----------------------------
    svm, hdc = load(TYPES, DIMS, N_SUBJECTS, BENCHMARK_PATH)
    thermometer, sgd = dim_vs_subject_mtrx(hdc, TYPES, DIMS, N_SUBJECTS)
    svm_, hdc_ = load(TYPES, DIMS, N_SUBJECTS, BENCHMARK_PATH_)
    thermometer_, sgd_ = dim_vs_subject_mtrx(hdc_, TYPES, DIMS, N_SUBJECTS)
    svm, thermometer, sgd = merge(
        [(svm, svm_), (thermometer, thermometer_), (sgd, sgd_)], (58 / 120, 62 / 120)
    )

    svm2, hdc2 = load(TYPES, DIMS, N_SUBJECTS_2, BENCHMARK_PATH_2)
    thermometer2, sgd2 = dim_vs_subject_mtrx(hdc2, TYPES, DIMS, N_SUBJECTS_2)

    multibar_minmax_std_table(
        DIMS[HDCtype.THERMOMETER],
        thermometer,
        thermometer2,
        "HDC-thermometer, impact of dimension",
    )


def bar_sgd_dim_datasets_accuracy():
    # --------- CONFIG -----------
    TYPES = [HDCtype.THERMOMETER, HDCtype.SGD]
    DIMS = {
        HDCtype.THERMOMETER: [75, 150, 369, 737],
        HDCtype.SGD: [500, 1000, 2000, 5000, 10000],
    }
    N_SUBJECTS = 5  # 5, 38
    # BENCHMARK_PATH = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/physionet/bfe-vs-bfi_CP34FC34/dataresult/physionet_FC_CP_34"
    BENCHMARK_PATH = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/3classMI/results/3classMI_256Hz_4ch"
    BENCHMARK_PATH_ = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/3classMI/results/4ch_b"

    # xxxxxxxxxxxxxx DATASET2 xxxxxxxxxxxxxx
    N_SUBJECTS_2 = 38  # 5, 38
    BENCHMARK_PATH_2 = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/physionet/bfe-vs-bfi_CP34FC34/dataresult/physionet_FC_CP_34"
    # ----------------------------
    svm, hdc = load(TYPES, DIMS, N_SUBJECTS, BENCHMARK_PATH)
    thermometer, sgd = dim_vs_subject_mtrx(hdc, TYPES, DIMS, N_SUBJECTS)
    svm_, hdc_ = load(TYPES, DIMS, N_SUBJECTS, BENCHMARK_PATH_)
    thermometer_, sgd_ = dim_vs_subject_mtrx(hdc_, TYPES, DIMS, N_SUBJECTS)
    svm, thermometer, sgd = merge(
        [(svm, svm_), (thermometer, thermometer_), (sgd, sgd_)], (58 / 120, 62 / 120)
    )

    svm2, hdc2 = load(TYPES, DIMS, N_SUBJECTS_2, BENCHMARK_PATH_2)
    thermometer2, sgd2 = dim_vs_subject_mtrx(hdc2, TYPES, DIMS, N_SUBJECTS_2)
    # print(thermometer)
    # heatmap(thermometer.transpose(), np.arange(N_SUBJECTS), DIMS[HDCtype.THERMOMETER])
    # barplot2(thermometer, DIMS[HDCtype.THERMOMETER])
    # barplot3(thermometer, sgd, svm)
    multibar_minmax_std_table(
        DIMS[HDCtype.SGD], sgd, sgd2, "HDC-SGD, impact of dimension"
    )
    # multibar_minmax_std_table(DIMS[HDCtype.SGD], sgd, sgd2)
    # barplot()


if __name__ == "__main__":
    # bar_sgd_dim_datasets_accuracy()
    bar_thermometer_dim_datasets_accuracy()
