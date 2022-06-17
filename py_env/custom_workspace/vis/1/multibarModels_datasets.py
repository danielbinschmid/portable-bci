import numpy as np
import matplotlib.pyplot as plt
from HDCtype import HDCtype
from load_benchmarks_hersche import load, dim_vs_subject_mtrx, merge


def multibar_table(A, B, C, modelNames=["SVM", "HDC-thermometer", "HDC-SGD"]):
    """
    A, B, C are 3-element tuples each

    X is of shape (n_dim, n_subjects)
    """
    n_datasets = 3
    n_models = 3
    a_data = [np.mean(A[0]), np.mean(B[0]), np.mean(C[0])]
    b_data = [np.mean(A[1]), np.mean(B[1]), np.mean(C[1])]
    c_data = [np.mean(A[2]), np.mean(B[2]), np.mean(C[2])]

    std_a = [np.std(A[0]), np.std(B[0]), np.std(C[0])]
    std_b = [np.std(A[1]), np.std(B[1]), np.std(C[1])]
    std_c = [np.std(A[2]), np.std(B[2]), np.std(C[2])]

    minmaxa = []
    minmaxa.append(
        [
            -1 * (np.min(A[0]) - np.mean(A[0])),
            -1 * (np.min(B[0]) - np.mean(B[0])),
            -1 * (np.min(B[0]) - np.mean(B[0])),
        ]
    )
    minmaxa.append(
        [
            np.max(A[0]) - np.mean(A[0]),
            np.max(B[0]) - np.mean(B[0]),
            np.max(B[0]) - np.mean(B[0]),
        ]
    )
    # minmaxa = [[-1 * (np.min(dim) - np.mean(dim)) for dim in A[]], [np.max(dim) - np.mean(dim)for dim in X2]]
    minmaxb = []
    minmaxb.append(
        [
            -1 * (np.min(A[1]) - np.mean(A[1])),
            -1 * (np.min(B[1]) - np.mean(B[1])),
            -1 * (np.min(B[1]) - np.mean(B[1])),
        ]
    )
    minmaxb.append(
        [
            np.max(A[1]) - np.mean(A[1]),
            np.max(B[1]) - np.mean(B[1]),
            np.max(B[1]) - np.mean(B[1]),
        ]
    )

    minmaxc = []
    minmaxc.append(
        [
            -1 * (np.min(A[2]) - np.mean(A[2])),
            -1 * (np.min(B[2]) - np.mean(B[2])),
            -1 * (np.min(B[2]) - np.mean(B[2])),
        ]
    )
    minmaxc.append(
        [
            np.max(A[2]) - np.mean(A[2]),
            np.max(B[2]) - np.mean(B[2]),
            np.max(B[2]) - np.mean(B[2]),
        ]
    )

    assert len(a_data) == len(b_data) and len(b_data) == len(c_data)
    n_models = len(a_data)

    l = lambda x: "%.3f" % round(x, 3)
    # a_str = [l(a_data[i]) + r" $\pm$ " + l(std_a[i])  for i in range(len(a_data))]
    # b_str = [l(b_data[i]) + r" $\pm$ " + l(std_b[i])  for i in range(len(b_data))]
    # c_str = [l(c_data[i]) + r" $\pm$ " + l(std_c[i])  for i in range(len(c_data))]

    a_str = [
        r"$\mu =$ "
        + l(a_data[i])
        + r"$\in$ ["
        + l(-minmaxa[0][i] + a_data[i])
        + ", "
        + l(minmaxa[1][i] + a_data[i])
        + "]"
        for i in range(len(a_data))
    ]
    b_str = [
        r"$\mu =$ "
        + l(b_data[i])
        + r"$\in$ ["
        + l(-minmaxb[0][i] + b_data[i])
        + ", "
        + l(minmaxb[1][i] + b_data[i])
        + "]"
        for i in range(len(b_data))
    ]
    c_str = [
        r"$\mu =$ "
        + l(c_data[i])
        + r"$\in$ ["
        + l(-minmaxc[0][i] + c_data[i])
        + ", "
        + l(minmaxc[1][i] + c_data[i])
        + "]"
        for i in range(len(c_data))
    ]

    fig, ax = plt.subplots()
    ax.set_ylim([0, 1])
    width = 0.6
    ind = np.arange(n_datasets)
    c1 = plt.cm.BuPu(np.linspace(0, 0.5, 5))[4]
    c2 = plt.cm.BuPu(np.linspace(0, 0.5, 5))[3]
    c3 = plt.cm.BuPu(np.linspace(0, 0.5, 5))[2]
    rectsa = ax.bar(ind, a_data, width / 3, color=c1, yerr=minmaxa)
    rectsb = ax.bar(
        ind + width / 3, b_data, width / 3, color=c2, yerr=minmaxb
    )  # , yerr=minmax2
    rectsc = ax.bar(ind + 2 * width / 3, c_data, width / 3, color=c3, yerr=minmaxc)
    # ax2 = ax.twinx()
    # ax2.boxplot([dim for dim in X1])
    # ax2.set_ylim(ax.get_ylim())

    # Add a table at the bottom of the axes

    cellText = [a_str, b_str, c_str]
    colLabels = ["EPF", "Physionet CP-AF-34", "Physionet Muse"]
    the_table = plt.table(
        cellText=cellText,
        rowLabels=modelNames,
        rowColours=[c1, c2, c3],
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

    # Adjust layout to make room for the table:
    plt.subplots_adjust(left=0.2, bottom=0.2)

    ax.set_ylabel("Accuracy")
    ax.set_title("SVM vs HDC thermometer and SGD")
    ax.set_xticks([])
    plt.show()


def p():
    # --------- CONFIG -----------
    TYPES = [HDCtype.THERMOMETER, HDCtype.SGD]
    DIMS = {
        HDCtype.THERMOMETER: [75, 150, 369, 737],
        HDCtype.SGD: [500, 1000, 2000, 5000, 10000],
    }
    N_SUBJECTS = 5  # 5, 38
    # BENCHMARK_PATH = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/physionet/bfe-vs-bfi_CP34FC34/dataresult/physionet_FC_CP_34"
    BENCHMARK_PATH = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/3classMI/results/3classMI_256Hz_4ch"

    # xxxxxxxxxxxx DATASET2 xxxxxxxxxxxxxx
    N_SUBJECTS_2 = 38  # 5, 38
    BENCHMARK_PATH_2 = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/physionet/bfe-vs-bfi_CP34FC34/dataresult/physionet_FC_CP_34"
    # xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    # xxxxxxxxxxxx DATASET3 xxxxxxxxxxxxxx
    N_SUBJECTS_3 = 38
    BENCHMARK_PATH_3 = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/physionet/bfe-vs-bfi_AF78_T910/dataresult/physionet_AF78T910"

    # ----------------------------
    svm, hdc = load(TYPES, DIMS, N_SUBJECTS, BENCHMARK_PATH)
    thermometer, sgd = dim_vs_subject_mtrx(hdc, TYPES, DIMS, N_SUBJECTS)
    BENCHMARK_PATH_ = "D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/3classMI/results/4ch_b"
    svm_, hdc_ = load(TYPES, DIMS, N_SUBJECTS, BENCHMARK_PATH_)
    thermometer_, sgd_ = dim_vs_subject_mtrx(hdc_, TYPES, DIMS, N_SUBJECTS)
    svm, thermometer, sgd = merge(
        [(svm, svm_), (thermometer, thermometer_), (sgd, sgd_)], (58 / 120, 62 / 120)
    )

    svm2, hdc2 = load(TYPES, DIMS, N_SUBJECTS_2, BENCHMARK_PATH_2)
    thermometer2, sgd2 = dim_vs_subject_mtrx(hdc2, TYPES, DIMS, N_SUBJECTS_2)

    svm3, hdc3 = load(TYPES, DIMS, N_SUBJECTS_3, BENCHMARK_PATH_3)
    thermometer3, sgd3 = dim_vs_subject_mtrx(hdc3, TYPES, DIMS, N_SUBJECTS_3)

    multibar_table(
        (svm, thermometer[3], sgd[4]),
        (svm2, thermometer2[3], sgd2[4]),
        (svm3, thermometer3[3], sgd3[4]),
    )


if __name__ == "__main__":
    p()
