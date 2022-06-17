import os
import numpy as np
from HDCtype import HDCtype


def load(
    TYPES=[HDCtype.THERMOMETER, HDCtype.SGD],
    DIMS={
        HDCtype.THERMOMETER: [75, 150, 369, 737],
        HDCtype.SGD: [500, 1000, 2000, 5000, 10000],
    },
    N_SUBJECTS=5,
    BENCHMARK_PATH="D:/bachelor-thesis/python_workspace/HDembedding-BCI/dataset/3classMI/results/3classMI_256Hz_4ch",
) -> tuple[list[float], dict[HDCtype, dict[int, list[float]]]]:
    """
    
    @returns:
        - svm accuracies for each subject
        - HDC type, to dimension, to kfoldcross-accuracy for subject
    """
    files = os.listdir(BENCHMARK_PATH)
    hdc_type = None
    benchmarks_hdc = {
        type: {d: [[] for i in range(N_SUBJECTS)] for d in DIMS[type]} for type in TYPES
    }
    benchmarks_svm = [[] for subject in range(N_SUBJECTS)]

    for file in files:
        # --------
        if file.startswith("thermometer"):
            hdc_type = HDCtype.THERMOMETER
        elif file.startswith("learn_HD_proj_SGD"):
            hdc_type = HDCtype.SGD
        else:
            raise ValueError("not known hdc type: %s" % file)
        # --------
        if hdc_type == HDCtype.THERMOMETER:
            dimension_start_idx = file.find("d=")
        elif hdc_type == HDCtype.SGD:
            dimension_start_idx = file.find("D=")

        dimension_end_idx = file.find("k=")
        dim = int(file[dimension_start_idx + 2 : dimension_end_idx])
        # --------

        benchmarks = np.load(os.path.join(BENCHMARK_PATH, file))
        benchmarks = benchmarks[
            "success"
        ]  # shape (n_subjects, k, 4) - last dim. is [SVM, LDA, HDC_TEST, HDC_TRAIN]

        for subject_idx in range(len(benchmarks)):
            svm = 0
            hdc = 0
            for fold in benchmarks[subject_idx]:
                svm += fold[0]
                hdc += fold[2]
            svm /= len(benchmarks[subject_idx])
            hdc /= len(benchmarks[subject_idx])

            benchmarks_hdc[hdc_type][dim][subject_idx].append(hdc)
            benchmarks_svm[subject_idx].append(svm)

    # ----------
    hdc_averaged = {
        type: {d: [None for i in range(N_SUBJECTS)] for d in DIMS[type]}
        for type in TYPES
    }
    for type in benchmarks_hdc.keys():
        for dim in benchmarks_hdc[type].keys():
            for subject_idx in range(len(benchmarks_hdc[type][dim])):
                for test_trial in benchmarks_hdc[type][dim][subject_idx]:
                    hdc_averaged[type][dim][subject_idx] = np.mean(test_trial)

    svm_averaged = [np.mean(subject) for subject in benchmarks_svm]

    return svm_averaged, hdc_averaged


def dim_vs_subject_mtrx(
    benchmarks: dict[HDCtype, dict[int, list[float]]], TYPES, DIMS, N_SUBJECTS
):
    res = []
    for type in TYPES:
        b = benchmarks[type]
        X = np.zeros((len(DIMS[type]), N_SUBJECTS))
        i = 0
        for dim in b.keys():
            for subject_idx in range(len(b[dim])):
                X[i, subject_idx] = b[dim][subject_idx]
            i += 1
        res.append(X)
    return (X for X in res)


def merge(X, weights: tuple[float, float]):
    """
    X is a list of tuples of ndarrays

    returns a tuple of ndarrays
    """
    d = []
    for tup in X:
        X1, X2 = tup
        X = np.asarray(X1) * weights[0] + np.asarray(X2) * weights[1]
        d.append(X)
    return tuple(d)


if __name__ == "__main__":
    svm, hdc = load()
    thermometer, sgd = dim_vs_subject_mtrx(hdc)
    print(thermometer)
    print(sgd)
