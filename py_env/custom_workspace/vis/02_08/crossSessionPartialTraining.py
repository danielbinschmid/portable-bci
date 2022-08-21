proportions = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1]

DeepConvNet = 0.663569
eegnet = [
 0.607296814837734,
0.6047777759430876,
0.6230921295711808,
0.6325453677827672,
0.6563779163800907,
0.6555003236503104,
0.6646314714173713,
0.6699484461164291,
0.6764780489796479,
0.6800802377521552,
 0.6836743385321585,
0.6870325072661085
]


eegnetHDC = [ 
  0.5081449680768392,
 0.5550162882068687,
 0.6069829144756407,
 0.634551285471239,
 0.6460829426959198,
 0.6534457623117516,
 0.6562391546869075,
 0.6647484200243867,
 0.6709156604873193,
 0.678022683433531,
  0.6811634823632366,
 0.6821817229608128
]


  

riemannNN = [
    0.48497893401800585,
    0.5260544652907081,
    0.5643341291901195,
    0.5930041344524807,
    0.601011118262636,
    0.6092576969594119,
    0.618711249854476,
    0.6180914047039355,
    0.629423523526023,
    0.6293700225495575,
    0.6347953695752088,
    0.6324928611524749,
]
SVM = [
    0.5060129271034295,
    0.545714303553524,
    0.5650748606595711,
    0.5857766252866352,
    0.5969788316959229,
    0.6018975528899918,
    0.6139863590831758,
    0.6205567992903088,
    0.6283006108713625,
    0.6338218349524071,
    0.6352978358796344,
    0.6381247968111257
]

LDA = [
    0.47617159791929925,
    0.5288027958147243,
    0.5560184554529893,
    0.5762492730683272,
    0.5795115463894613,
    0.584076038956531,
    0.5913980704819898,
    0.5945613410625685,
    0.6011853695011594,
    0.6016845471908222,
    0.6029681555286487,
    0.6057204662827557
]

HRR_DimRanking = [ 
     0.4649136623851791,
    0.5346668858875487,
    0.5875692718868837,
    0.6071847707584267,
    0.6098365931281875,
    0.6135746594918994,
    0.6132804142039304,
    0.6232333139940968,
    0.6261125937999878,
    0.6254586920258185,
     0.6277858220360232,
     0.6298684676926559
]


HRR = [
     0.4784877087573552,
    0.5141052937991675,
    0.5614757441324264,
    0.5824257933721597,
    0.599963819684802,
    0.6038057941502402,
    0.604258827588613,
    0.6157211118918755,
    0.6144561379251908,
    0.6195152135292066,
     0.618725193876609,
    0.6187547358572294
]

thermometer = [
0.49118722721665486,
0.5331796676908882,
0.5726748281341536,
0.5846002573661339,
0.5993315832705758,
0.6008133632957187,
0.6117637591444564,
0.6101911548252555,
0.6121857462793557,
0.614518057640952,
0.613530930330193,
0.6129872507142671
]



from cProfile import label
import plotting
plotting.prepare_for_latex()
import matplotlib.pyplot as plt
import numpy as np


"""
{'.': 'point', 
',': 'pixel',
 'o': 'circle', 
 'v': 'triangle_down', 
 '^': 'triangle_up',
  '<': 'triangle_left', 
  '>': 'triangle_right',
   '1': 'tri_down', 
   '2': 'tri_up', 
   '3': 'tri_left', 
   '4': 'tri_right', 
   '8': 'octagon', 
   's': 'square', 
   'p': 'pentagon', 
   '*': 'star',
    'h': 'hexagon1', 
    'H': 'hexagon2', '+': 
    'plus', 
    'x': 'x', 
    'D': 'diamond', 
    'd': 'thin_diamond',
     '|': 'vline', 
     '_': 'hline', 
     'P': 'plus_filled', 
     'X': 'x_filled', 
     0: 'tickleft', 
     1: 'tickright',
      2: 'tickup',
       3: 'tickdown', 4: 'caretleft', 5: 'caretright', 6: 'caretup', 7: 'caretdown', 8: 'caretleftbase', 9: 'caretrightbase', 10: 'caretupbase', 11: 'caretdownbase', 'None': 'nothing', None: 'nothing', ' ': 'nothing', '': 'nothing'}
"""

def p(X, labels, colors, linestyles, title, scatterStyle, plotDeepConvNet=True):
    # Major ticks every 20, minor ticks every 5

    fig, ax = plt.subplots()
    w, h = plotting.get_dimensions(350, 1)
    fig.set_size_inches(w, h)
    plotting.above_legend_args(ax)

    major_ticks_x = np.arange(0, 1, 0.05)
    minor_ticks_x = np.arange(0, 1, 0.025)
    major_ticks_y = np.arange(0, len(X[0]), 1)

    ax.set_xticks(major_ticks_y)
    ax.set_yticks(major_ticks_x, fontname = "sans-serif")
    ax.set_yticks(minor_ticks_x, minor=True, fontname = "sans-serif")

    ax.grid(which="minor", alpha=0.05)
    ax.grid(which="major", alpha=0.125)
    y = np.arange(0, len(X[0]))
    for i in range(len(X)):
        x = X[i]
        ax.scatter(y, x, color=colors[i], marker=scatterStyle[i], label=labels[i], s=20)
        ax.plot(y, x, ls=linestyles[i], color=colors[i])
    if plotDeepConvNet:
        ax.scatter([11], DeepConvNet, marker='1', s=100, label="DeepConvNet")

    ax.set_xlabel("Training set percentage")
    ax.set_ylabel("Accuracy")
    ax.set_xticklabels(proportions)
    yticklabels = [str(int(x * 100) / 100) for x in major_ticks_x]
    ax.set_yticklabels(yticklabels)
    ax.set_title(title)
    
    ax.legend()

    
    plt.savefig("crossSessionPartialTraining_reducedB.pdf")

"""
X =            [riemannNN, SVM    , LDA    , HRR    , HRR_DimRanking  , thermometer      , eegnetHDC   , eegnet  ]
labels =       ["FNN"    , "SVM"  , "LDA"  , "HRR"  , "HRR+DimRanking", "HDC-thermometer", "EEGNet+HDC", "EEGNet"]
colors =       ["purple" , "green", "black", "brown", "orange"        , "blue"           , "red"       , "grey"  ]
linestyles =   ["solid"  , "solid", ":"    , ":"    , "solid"         ,":"               , "solid"     , "solid" ]
scatterStyle = ["*"      , "v"    , "x"    , "d"    , ">"             , "+"              , "s"         , "p"     ]
    """
def main():

    X =            [ SVM    , HRR_DimRanking  , eegnetHDC   , eegnet  ]
    labels =       [ "SVM"  , "HRR+DimRanking", "EEGNet+HDC", "EEGNet"]
    colors =       [ "green", "orange"        , "red"       , "grey"  ]
    linestyles =   [ "solid", "solid"         , "solid"     , "solid" ]
    scatterStyle = [ "v"    , ">"             , "s"         , "p"     ]
    # '-', '--', '-.', ':', 'None', ' ', '', 'solid', 'dashed', 'dashdot', 'dotted'

    p(X, labels, colors, linestyles, "Partial training data for cross session prediction", scatterStyle, True)



if __name__ == "__main__":
    main()