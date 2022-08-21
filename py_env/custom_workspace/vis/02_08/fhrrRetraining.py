fhrrTrain_all = [
    0.5100748416810593,
    0.5647668393782384,
    0.6603339090385723,
    0.6459412780656304,
    0.6850892343120323,
    0.6925734024179621,
    0.6862406447898676,
    0.7369027058146229,
    0.7743235463442717,
    0.7587795048934945,
    0.7489925158318941,
    0.6983304548071387,
    0.7829591249280369,
    0.7484168105929764,
    0.6845135290731146,
    0.7202072538860104,
]

fhrrTest_all = [
    0.49355019629837354,
    0.430173864273696,
    0.45653393157599553,
    0.48513740886146944,
    0.47560291643297814,
    0.4991587212563096,
    0.46606842400448684,
    0.5064498037016265,
    0.48625911385305665,
    0.5176668536174986,
    0.4727986539540101,
    0.46831183398766124,
    0.4677509814918676,
    0.4991587212563096,
    0.485698261357263,
    0.48850252383623105,
]

hrrTrain_all = [
    0.46632124352331605,
    0.5762809441565918,
    0.5561312607944733,
    0.5659182498560736,
    0.5854922279792746,
    0.5434657455382844,
    0.5774323546344272,
    0.5624640184225677,
    0.5664939550949913,
    0.5428900402993667,
    0.5716753022452504,
    0.5578583765112263,
    0.5630397236614854,
    0.595279217040875,
    0.5722510074841681,
    0.5803108808290155,
]

hrrTest_all = [
    0.5008412787436904,
    0.5429052159282108,
    0.5300056085249579,
    0.5417835109366237,
    0.5367358384744813,
    0.5255187885586091,
    0.532809871003926,
    0.5305664610207516,
    0.5266404935501963,
    0.5238362310712282,
    0.5305664610207516,
    0.5294447560291643,
    0.5367358384744813,
    0.5389792484576557,
    0.532809871003926,
    0.5401009534492428,
]

fhrrTrain_single = [
    0.9064625850340136,
    0.9557823129251701,
    0.9064625850340136,
    0.9625850340136055,
    0.9064625850340136,
    0.9693877551020409,
    0.9132653061224489,
    0.967687074829932,
    0.9234693877551021,
    0.9506802721088436
]


fhrrTest_single = [
    0.7077175697865353,
    0.7110016420361248,
    0.7044334975369458,
    0.7011494252873564,
    0.7044334975369458,
    0.715927750410509,
    0.7044334975369458,
    0.7208538587848933,
    0.6798029556650246,
    0.7077175697865353,
]


hrrTrain_single = [
    0.7942176870748299,
0.8163265306122449,
      0.8350340136054422,
      0.8622448979591837,
      0.8826530612244898,
      0.8877551020408163,
      0.9030612244897959,
      0.9166666666666667,
      0.9234693877551021,
      0.9336734693877551,
]


hrrTest_single = [
     0.7011494252873564,
0.7093596059113301,
      0.7077175697865353,
      0.7110016420361248,
      0.7142857142857143,
      0.722495894909688,
      0.7241379310344828,
      0.7175697865353038,
      0.729064039408867,
      0.7257799671592775,
]


import matplotlib.pyplot as plt
import numpy as np
import plotting

plotting.prepare_for_latex()

def p(X, labels, colors, linestyles, title, fig, ax, ylabel, isAll, isTrain):
    # Major ticks every 20, minor ticks every 5
    X = np.array(X)

    vals = np.array(X).flatten()
    ymin = int(np.min(vals) * 2 * 10) / (2 * 10)
    ymax =  math.ceil(np.max(vals) * 2 * 10) / (2 * 10)
    # ymin = int(ymin * 1000) / 1000
    #ymax = int(ymax * 1000) / 1000
    ax.set_ylim(round(ymin, 3), round(ymax, 3))
    print(ymax)

    a = 2
    
    if isTrain:
        if isAll:
            major_ticks_x = np.arange(ymin, ymax + 0.001, 0.1)
            minor_ticks_x = np.arange(ymin, ymax + 0.001, 0.05)
        else:
            major_ticks_x = np.arange(ymin, ymax + 0.001, 0.05)
            minor_ticks_x = np.arange(ymin, ymax + 0.001, 0.025)
    else:
        if isAll:
            major_ticks_x = np.arange(ymin, ymax + 0.001, 0.05)
            minor_ticks_x = np.arange(ymin, ymax + 0.001, 0.025)
        else:
            major_ticks_x = np.arange(ymin, ymax + 0.001, 0.025)
            minor_ticks_x = np.arange(ymin, ymax + 0.001, 0.0125)
            a = 3
    
    if isAll:
        major_ticks_y = np.arange(0, len(X[0]), 2)
    else:
        major_ticks_y = np.arange(0, len(X[0]),1)
        
    major_ticks_x = [round(x, 3) for x in major_ticks_x]
    print(major_ticks_x)
    ax.set_xticks(major_ticks_y)
    ax.set_yticks(major_ticks_x)
    ax.set_yticks(minor_ticks_x, minor=True)

    ax.grid(which="minor", alpha=0.05)
    ax.grid(which="major", alpha=0.125)
    y = np.arange(0, len(X[0]))
    for i in range(len(X)):
        x = X[i]
        ax.plot(y, x, ls=linestyles[i], color=colors[i])

    ax.set_xlabel("Retraining iterations")
    ax.set_ylabel(ylabel)
    ax.set_title(title)

    if isAll and not isTrain:
        ax.legend(labels, loc='lower right')
    else:
        ax.legend(labels)
    ax.set_xticklabels(major_ticks_y)
    if a == 2:
        lsmall = lambda d: "%.2f" % round(d, 2)
    else:
        lsmall = lambda d: "%.3f" % round(d, 3)
    yticklabels = [lsmall(x) for x in major_ticks_x]
    ax.set_yticklabels(yticklabels)
    


def main():

    labels = ["HRR train", "HRR test", "fHRR train", "fHRR test"]
    colors = ["red", "red", "blue", "blue"]
    linestyles = ["solid", "dashed", "dashdot", "dotted"]
    # ["solid", "dashed", "dotted", "dashdot", "-", "--", "-.", ":"]
    X_all = [hrrTrain_all, hrrTest_all, fhrrTrain_all, fhrrTest_all]
    p(X_all, labels, colors, linestyles, "BCI IV2a, all subjects", fig, ax[0])

    X_single = [hrrTrain_single, hrrTest_single, fhrrTrain_single, fhrrTest_single]
    # plot with four lines,
    p(X_single, labels, colors, linestyles, "BCI IV2a, subject 8", fig, ax[1])

    plt.savefig("fhrrRetrainingEvolution.pdf")
import math 

def main2():

    fig, ax = plt.subplots(2, 2)
    w, h = plotting.get_dimensions(300, 1)
    fig.set_size_inches(w, h)

    labels = ["HRR", "fHRR"]
    colors = ["red", "blue"]
    linestyles = ["solid", "dashed"]
    # ["solid", "dashed", "dotted", "dashdot", "-", "--", "-.", ":"]
    X1_1 = [hrrTrain_all, fhrrTrain_all]
    fig, ax = plt.subplots()
    w, h = plotting.get_dimensions(150, 1, True)
    fig.set_size_inches(w, h)
    p(X1_1, labels, colors, linestyles, "", fig, ax, "Accuracy", True, True)
    plt.savefig("fhrrRetrainingEvolutionAllTrain.pdf")

    X1_2 = [hrrTest_all, fhrrTest_all]
    fig, ax = plt.subplots()
    w, h = plotting.get_dimensions(150, 1, True)
    fig.set_size_inches(w, h)
    p(X1_2, [], colors, linestyles, "", fig, ax, "", True, False)
    plt.savefig("fhrrRetrainingEvolutionAllTest.pdf")

    X2_1 = [hrrTrain_single, fhrrTrain_single]
    fig, ax = plt.subplots()
    w, h = plotting.get_dimensions(150, 1, True)
    fig.set_size_inches(w, h)
    p(X2_1, [], colors, linestyles, "", fig, ax, "Accuracy", False, True)
    plt.savefig("fhrrRetrainingEvolutionOneTrain.pdf")

    X2_2 = [hrrTest_single, fhrrTest_single]
    fig, ax = plt.subplots()
    w, h = plotting.get_dimensions(150, 1, True)
    fig.set_size_inches(w, h)
    p(X2_2, [], colors, linestyles, "", fig, ax, "", False, False)
    plt.savefig("fhrrRetrainingEvolutionOneTest.pdf")

if __name__ == "__main__":
    main2()
