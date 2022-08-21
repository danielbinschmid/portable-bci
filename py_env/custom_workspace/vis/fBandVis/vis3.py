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

                fBandIdxs = [41]
                labels = ["1-Sensor EEG"]

                s = len(fBandIdxs)
                fig, ax = plt.subplots(s)
                w, h = plotting.get_dimensions(100, 1, True)
                fig.set_size_inches(w, h)
                timeaxis = [i for i in range(tend - tstart)]
                plotIdx = 0
                colors = ["orange"]
                for i in range(s):
                    idx = fBandIdxs[i]
                    print(idx)
                    for c in range(1):
                        label = labels[i]

                        ax.plot(timeaxis, d[idx, c, tstart:tend], linewidth=1, color=colors[i]) # , linewidth=2

                    
                    ax.grid(True)
                    ax.set_ylim((-10, 10))
                    ax.set_xticks([])
                    # i].set_xlabel(label)
                    # i].set_ylabel(r"EEG in $\mu V$")
                    ax.set_title(label)

                plt.tight_layout()
                plt.savefig("b.pdf")
        
if __name__ == "__main__":
    plot_filters()