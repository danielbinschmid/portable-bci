import json
import numpy as np
import matplotlib.pyplot as plt
import plotting

plotting.prepare_for_latex()

def calcIdx(label: tuple[int, int], lookup: list[dict[str, int]]) -> int:
    for i in range(len(lookup)):
        if lookup[i]["begin"] == label[0] and lookup[i]["end"] == label[1]:
            return i

    raise Exception("index combination not found")

def genLookup():
    with open("./data/filtered_cpp.json") as fcpp:
        with open("./data/band_labels_hersche.json") as hersche_labels:
            cpp_data = json.load(fcpp)
            cpp_lookup = cpp_data["labels"]
            labels = json.load(hersche_labels)
            hersche_idx = 0
            label_lookup = {}
            for label in labels:
                label_str = str(label[0]) + "," + str(label[1])
                own_idx = calcIdx((label[0], label[1]), cpp_lookup)

                label_lookup[label_str] = {
                    "hersche": hersche_idx,
                    "own": own_idx
                }

                hersche_idx += 1
            
            with open("./data/labels_lookup.json", 'w', encoding='utf-8') as f:
                json.dump(label_lookup, f)

def plot_filters():
    tstart = 0
    tend = 200

    n_plots = 11
    lines_per_plot = 4
    with open("./data/filtered_cpp.json") as fcpp:
        with open("./data/filtered.json") as f:
            with open("./data/band_labels_hersche.json") as hersche_labels:
                # labels = json.load(hersche_labels)

                d = json.load(f)
                d = d["filtered_data"]
                d = np.array(d)[0]
                print(d.shape) # (1, 43, 4, 875)

                fBandIdxs = [18, 19, 37, 34]
                labels = [r"$\theta$, 4-8Hz", r"$\alpha$, 8-12Hz", r"$\beta$, 12-28Hz", r"$\gamma$, 32-40Hz"]

                s = len(fBandIdxs)
                fig, ax = plt.subplots(s)
                w, h = plotting.get_dimensions(300, 1, True)
                fig.set_size_inches(w, h)
                timeaxis = [i for i in range(tend - tstart)]
                plotIdx = 0
                colors = ["orange", "orange", "orange", "orange"]
                for i in range(s):
                    idx = fBandIdxs[i]
                    print(idx)
                    for c in range(1):
                        label = labels[i]
                        yPlot = d[idx, c, tstart:tend]
                        if i == 3:
                            yPlot = yPlot * 3
                            c += 2
                        ax[i].plot(timeaxis, yPlot, linewidth=1, color=colors[i]) # , linewidth=2

                    
                    ax[i].grid(True)
                    ax[i].set_ylim((-10, 10))
                    ax[i].set_xticks([])
                    # ax[i].set_xlabel(label)
                    # ax[i].set_ylabel(r"EEG in $\mu V$")
                    ax[i].set_title(label)

                plt.tight_layout()
                plt.savefig("a2.svg")
        
if __name__ == "__main__":
    plot_filters()