import os
from random import shuffle

if __name__ == "__main__":
    import sys
    os.chdir("..")
    sys.path.append("./data_utils/")
    sys.path.append("./data_utils/custom_typing/")
    sys.path.append("./nn_utils/")

    
from n_RiemannNN import RiemannNet
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
data = {}
training_percentages =  [1]#  [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1]

for subject in subjects:
    path = os.path.join(os.curdir, "data", "IV2a", "dataset", "subj_") + str(subject) + ".json"
    with open(path, 'r') as f:
        data_parsed = json.load(f)
        data[subject] = data_parsed 

avgs = {}
runs = 10
for trainingPerc in training_percentages:
    avgs[str(trainingPerc)] = 0
    for run in range(runs):
        for subject in subjects:
            for session in sessions:
                print("%%%%%%%%%%%%%%%%%")
                print(trainingPerc)
                print(subject)
                session_id = "session" + ("_true" if session else "_false")
                print(session_id)
                net = RiemannNet(43, 10, 3)

                labelLookup = [ 
                    [1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]
                ]
                X = []
                Y= []
                Y2 = []
                for s in [subject]:
                    X += data[s][session_id]["trainArray"]
                    Y2 += [l for l in data[s][session_id]["trainLabels"]]
                    Y += [labelLookup[l] for l in data[s][session_id]["trainLabels"]]

                

                shuffled_indeces = np.asarray(balanced_shuffle(Y2, [0, 1, 2]))[0: int(trainingPerc * len(X))]
                X = np.asarray(X)
                X = X.reshape((len(X), 43, 10))[shuffled_indeces]
                Y = np.asarray(Y)[shuffled_indeces]
                # X = X.reshape(X.shape[0], X.shape[1] * X.shape[2])
                net.compile(loss='categorical_crossentropy', optimizer='adam', 
                    metrics = ['accuracy'])
                net.fit(X, Y, epochs=150, verbose=0)



                benchmark_data =   np.asarray([np.asarray(point).reshape([43, 10]) for point in data[subject][session_id]["benchmarkArray"]])
                benchmark_labels = data[subject][session_id]["benchmarkLabels"]
                
                # preds = clf_SVM.predict(benchmark_data)
                preds = net.predict(benchmark_data)
                n = 0
                for i in range(len(preds)): 
                    
                    n += np.argmax(preds[i]) == benchmark_labels[i]
                print(n / benchmark_data.shape[0])
                avgs[str(trainingPerc)] += n / (benchmark_data.shape[0] * len(subjects) * len(sessions) * runs) 
    print(avgs)
print("avgs:")
print(avgs)