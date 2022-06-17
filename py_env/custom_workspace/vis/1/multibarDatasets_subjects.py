import numpy as np
import matplotlib.pyplot as plt
from HDCtype import HDCtype
from load_benchmarks_hersche import load, dim_vs_subject_mtrx, merge


def multibarDatsets_subjects(A, B, dataset_names=[]):
    """
    A is dataset 1
    B is dataset 2

    tuple of models
    model of shape (n_subjects)
    """
    n_subjects = len(A[0])
    assert len(A[0]) == len(B[0])
    A = np.asarray(A)
    B = np.asarray(B)
    data = [
        (subject, np.max(B[:, subject]), np.max(A[:, subject]))
        for subject in range(n_subjects)
    ]

    data = sorted(
        data, key=lambda tup: tup[2]
    )  # 1 - ((1 - tup[1]) ** 2 + (1- tup[2]) ** 2)
    # print(data)

    A = [tup[2] for tup in data]
    B = [tup[1] for tup in data]
    ind_str = [str(tup[0]) for tup in data]
    ind = np.arange(n_subjects)
    data = [A, B]

    fig, ax = plt.subplots(2)
    ax[0].grid(alpha=0.5)
    ax[1].grid(alpha=0.5)
    ax[0].set_ylim([0.4, 1])
    ax[1].set_ylim([0.4, 1])
    width = 0.8

    colors = plt.cm.magma(np.linspace(0, 1, 100))
    a_colors = [colors[99 - int(acc * 100)] for acc in A]
    b_colors = [colors[99 - int(acc * 100)] for acc in B]

    rect1 = ax[0].bar(ind, A, width, color=a_colors)
    rect2 = ax[1].bar(ind, B, width, color=b_colors)
    """
    l = lambda x: "%.3f"%round(x, 3)
    cellText = [[l(acc) for acc in dataset] for dataset in data]
    colLabels = [str(subj) for subj in range(n_subjects)]
    the_table = plt.table(cellText=cellText,
                        rowLabels=dataset_names,
                        rowColours=colors,
                        colLabels=colLabels,
                        loc='bottom',
                        cellLoc='center')

    the_table.scale(1, 1.5)
    """

    # the_table.set_fontsize(25)

    # Adjust layout to make room for the table:

    ax[0].set_ylabel("Accuracy")
    ax[0].set_title("Per subject accuracy on CP3, CP4, AF3 and AF4 (Physionet)")
    ax[0].set_xticks(ind, ind_str)

    ax[1].set_ylabel("Accuracy")
    ax[1].set_title(
        "Per subject accuracy on AF7, AF8, T9 and T10 (Muse-like configuration on Physionet)"
    )
    ax[1].set_xticks(ind, ind_str)

    plt.tight_layout()

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

    # model_multibar_subjects([svm, thermometer[2], sgd[4]], model_names=["SVM", "HDC-thermometer", "HDC-SGD"])
    multibarDatsets_subjects(
        [svm2, thermometer2[3], sgd2[4]],
        [svm3, thermometer3[3], sgd3[4]],
        ["Physionet CP-AF-34", "Physionet Muse"],
    )


if __name__ == "__main__":
    p()
