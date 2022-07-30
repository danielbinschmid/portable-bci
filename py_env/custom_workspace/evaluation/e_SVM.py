import os
from random import shuffle

if __name__ == "__main__":
    import sys
    os.chdir("..")
    sys.path.append("./data_utils/")
    sys.path.append("./data_utils/custom_typing/")
    sys.path.append("./nn_utils/")

    

from n_SVM import svm_nonlinear, svm_multires
from n_LDA import lda_multires
import numpy as np
import json

def balanced_shuffle(labels, class_vec):
    labels = [(labels[i], i) for i in range(0, len(labels))]
    s = [[label for label in labels if label[0] == c] for c in class_vec]
    for cs in s:
        shuffle(cs)
    minSize = min([len(cs) for cs in s])

    balanced_indeces = []
    for i in range(0, minSize):
        for cs in s:
            balanced_indeces.append(cs[i][1])
    return balanced_indeces

subjects = np.arange(1, 10)
sessions = [False, True]
trainingPercs = [1, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]
data = {}

for subject in subjects:
    path = os.path.join(os.curdir, "data", "IV2a", "dataset", "subj_") + str(subject) + ".json"
    with open(path, 'r') as f:
        data_parsed = json.load(f)
        data[subject] = data_parsed 

runs = 10
avgs = {}
for trainingPerc in trainingPercs:
    avgs[str(trainingPerc)] = {}
    avgs[str(trainingPerc)]["LDA"] = 0
    avgs[str(trainingPerc)]["SVM"] = 0
    for run in range(0, runs):
        
        for subject in subjects:
            trainingPercID = "trainingPerc_" + str(trainingPerc)
            for session in sessions:
                session_id = "session" + ("_true" if session else "_false")
                svm_c = 0.05
                clf_SVM = svm_multires(
                        C=svm_c,
                        intercept_scaling=1,
                        loss="hinge",
                        max_iter=10000,
                        multi_class="ovr",
                        penalty="l2",
                        random_state=1,
                        tol=0.00001,
                        precision=64,
                    )
                clf_LDA = lda_multires(solver="lsqr", shrinkage="auto", precision=64)

                X = []
                Y= []
                for s in [subject]:
                    X += data[s][session_id]["trainArray"]
                    Y += [l + 1 for l in data[s][session_id]["trainLabels"]]
                shuffled_indeces = np.asarray(balanced_shuffle(Y, [1, 2, 3]))[0: int(trainingPerc * len(X))]

                X = np.asarray(X)[shuffled_indeces]
                Y = np.asarray(Y)[shuffled_indeces]
                # X = X.reshape(X.shape[0], X.shape[1] * X.shape[2])

                clf_SVM.fit(X, Y)
                clf_LDA.fit(X, Y)
                benchmark_data =   np.asarray([np.asarray(point).flatten() for point in data[subject][session_id]["benchmarkArray"]])
                benchmark_labels = data[subject][session_id]["benchmarkLabels"]
                
                # preds = clf_SVM.predict(benchmark_data)
                preds = clf_LDA.predict(benchmark_data)
                n = 0
                for i in range(len(preds)): 
                    n += preds[i] - 1 == benchmark_labels[i]
                print(n / benchmark_data.shape[0])
                avgs[str(trainingPerc)]["LDA"]+= n / (benchmark_data.shape[0] * len(subjects) * len(sessions) * runs)



                # preds = clf_SVM.predict(benchmark_data)
                preds = clf_SVM.predict(benchmark_data)
                n = 0
                for i in range(len(preds)): 
                    n += preds[i] - 1 == benchmark_labels[i]
                print(n / benchmark_data.shape[0])
                avgs[str(trainingPerc)]["SVM"]+= n / (benchmark_data.shape[0] * len(subjects) * len(sessions) * runs)
print(avgs)