import os

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

subjects = np.arange(1, 10)
sessions = [False, True]
data = {}

for subject in subjects:
    path = os.path.join(os.curdir, "data", "IV2a", "dataset", "subj_") + str(subject) + ".json"
    with open(path, 'r') as f:
        data_parsed = json.load(f)
        data[subject] = data_parsed 

avg = 0
net = RiemannNet(43, 10, 3)
net.summary()
for subject in subjects:
    for session in sessions:
        session_id = "session" + ("_true" if session else "_false")
        
       

        labelLookup = [ 
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ]
        X = []
        Y= []
        for s in [subject]:
            X += data[s][session_id]["trainArray"]
            Y += [labelLookup[l] for l in data[s][session_id]["trainLabels"]]
        X = np.asarray(X)
        X = X.reshape((len(X), 43, 10))

        # X = X.reshape(X.shape[0], X.shape[1] * X.shape[2])
        net.compile(loss='categorical_crossentropy', optimizer='adam', 
            metrics = ['accuracy'])
        net.fit(X, np.asarray(Y), epochs=150, verbose=0)



        benchmark_data =   np.asarray([np.asarray(point).reshape([43, 10]) for point in data[subject][session_id]["benchmarkArray"]])
        benchmark_labels = data[subject][session_id]["benchmarkLabels"]
        
        # preds = clf_SVM.predict(benchmark_data)
        preds = net.predict(benchmark_data)
        n = 0
        for i in range(len(preds)): 
            
            n += np.argmax(preds[i]) == benchmark_labels[i]
        print(n / benchmark_data.shape[0])
        avg+= n / (benchmark_data.shape[0] * len(subjects) * len(sessions))
print("avg:")
print(avg)