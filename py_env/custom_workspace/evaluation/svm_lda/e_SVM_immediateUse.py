import os

if __name__ == "__main__":
    import sys
    os.chdir("..")
    sys.path.append("./data_utils/")
    sys.path.append("./data_utils/custom_typing/")
    sys.path.append("./nn_utils/")

    

from n_SVM import svm_multires
from n_LDA import lda_multires
import numpy as np
import json



subjects: np.ndarray = np.arange(1, 10)
sessions= [False, True]

data = {}

for subject in subjects:
    path = os.path.join(os.curdir, "data", "IV2a", "dataset", "subj_") + str(subject) + ".json"
    with open(path, 'r') as f:
        data_parsed = json.load(f)
        data[subject] = data_parsed 

runs = 1
avgs = {"LDA": 0, "SVM": 0}

for run in range(0, runs):
    
    for subject in subjects:
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
            subjects_: list[int] = subjects.tolist()
            subjects_.remove(subject)
            for s in subjects_:
                X += data[s][session_id]["trainArray"]
                Y += [l + 1 for l in data[s][session_id]["trainLabels"]]

            # X = X.reshape(X.shape[0], X.shape[1] * X.shape[2])

            clf_SVM.fit(X, Y)
            clf_LDA.fit(X, Y)
            benchmark_data =   np.asarray([np.asarray(point).flatten() for point in data[subject][session_id]["trainArray"]])
            benchmark_labels = data[subject][session_id]["trainLabels"]
            
            # preds = clf_SVM.predict(benchmark_data)
            preds = clf_LDA.predict(benchmark_data)
            n = 0
            for i in range(len(preds)): 
                n += preds[i] - 1 == benchmark_labels[i]
            print("///")
            print("LDA")
            print(n / benchmark_data.shape[0])
            avgs["LDA"]+= n / (benchmark_data.shape[0] * len(subjects) * len(sessions) * runs)



            # preds = clf_SVM.predict(benchmark_data)
            preds = clf_SVM.predict(benchmark_data)
            n = 0
            for i in range(len(preds)): 
                n += preds[i] - 1 == benchmark_labels[i]
            print("SVM")
            print(n / benchmark_data.shape[0])
            avgs["SVM"]+= n / (benchmark_data.shape[0] * len(subjects) * len(sessions) * runs)
print(avgs)