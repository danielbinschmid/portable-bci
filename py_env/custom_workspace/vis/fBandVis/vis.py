import json
import numpy as np
import matplotlib.pyplot as plt

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
                labels = json.load(hersche_labels)

                d = json.load(f)
                d = d["filtered_data"]
                d = np.array(d)[0]
                print(d.shape) # (1, 43, 4, 875)

                
                cpp_data = json.load(fcpp)
                cpp_lookup = cpp_data["labels"]
                cpp_data = np.array(cpp_data["data"])[0]
                

                for i in range(n_plots):
                    fig, ax = plt.subplots(lines_per_plot, 2)
                    timeaxis = [i for i in range(tend - tstart)]
                    for y in range(lines_per_plot):
                        if y + i * lines_per_plot < 43:
                            for type in [0, 1]:
                                idx = y + i * lines_per_plot
                                for c in range(3):
                                    label = (labels[idx][0], labels[idx][1])
                                    label_str = "bandpass filtered between [%d, %d] "%label
                                    idx_cpp = calcIdx(label, cpp_lookup)

                                    if type == 0:
                                        ax[y][type].plot(timeaxis, d[idx, c, tstart:tend], linewidth=2) # , linewidth=2
                                    else:
                                        label_str = "cpp" + label_str
                                        ax[y][type].plot(timeaxis, cpp_data[idx_cpp, c, tstart:tend], linewidth=2) # , linewidth=2
                                ax[y][type].grid(True)
                                ax[y][type].set_ylim((-10, 10))
                                ax[y][type].set_xticks([])
                                ax[y][type].set_xlabel(label_str + str(idx))

                    plt.tight_layout()
                    plt.show()
        
if __name__ == "__main__":
    plot_filters()