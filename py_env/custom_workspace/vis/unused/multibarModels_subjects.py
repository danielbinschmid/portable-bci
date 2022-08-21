import numpy as np
import matplotlib.pyplot as plt
from HDCtype import HDCtype
from load_benchmarks_hersche import load, dim_vs_subject_mtrx, merge


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
    ax.set_title("Per-subject accuracy on EPF dataset")
    ax.set_xticks([])
    # ax.set_xticks(ind)
    # ax.set_xticklabels((d for d in dimensions))

    #  ax.legend((rects1[0], rects2[0]), ("EPF dataset", "physionet dataset"))

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

    model_multibar_subjects(
        [svm, thermometer[3], sgd[4]], model_names=["SVM", "HDC-thermometer", "HDC-SGD"]
    )


if __name__ == "__main__":
    p()
