/**
 * Experiment to validate CiM HDC model
 */

import { SETTINGS } from "../../tools/hdc/hdcCiMBase";
import { HdcCiMBsc } from "../../tools/hdc/hdcCiMBsc";
import { HdcCiMHrr } from "../../tools/hdc/hdcCiMHrr";
import { HdcHersche, Encodings } from "../../tools/hdc/hdchersche";
import { collectIV2a, loadCached } from "../data_utils/readIV2a";
import { Riemann } from "../../tools/riemann/riemann";
import { maxIdx, arange, flatten3, balancedShuffle } from "../data_utils/array_utils";
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm
import { saveAsJSON } from "../data_utils/save_benchmarks";

function get_data(data, isReversed) {
    const data_ = {};
    if (isReversed) {
        data_.train_data = data.benchmark_data;
        data_.train_labels = data.benchmark_labels;
        data_.benchmark_data = data.train_data;
        data_.benchmark_labels = data.train_labels;
    } else {
        data_.train_data = data.train_data;
        data_.train_labels = data.train_labels;
        data_.benchmark_data = data.benchmark_data;
        data_.benchmark_labels = data.benchmark_labels;
    }
    return data_;
}

/**
* 
* @param {Riemann} riemann 
*/
export async function evaluate(riemann) {
    // --------- CONFIG ---------
    const subjects = arange(1, 10)
    const frequency = 250;
    const trialLengthSecs = 3.5;
    const breakLengthSecs = 2.5;
    const cached = true;

    const basicSettings = {
        nBands: 43,
        nChannels: 4,
        hdDim: 10000,
        classLabels: [0, 1, 2],
        useTSpaceNGrams: false
    }
    const trainingPercentages = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1]
    const nRuns = 10;
    const timeseries = riemann.Timeseries(basicSettings.nChannels, basicSettings.nBands, frequency, trialLengthSecs * frequency);

    const experimentID = "hersche_partial_cross_session"
    // -------------------------

    var dataAll = {};
    if (cached) { dataAll = loadCached(riemann, subjects); }

    const accs = {};
    const avgs = {}

    for (var run = 0; run < nRuns; run++) {
        const run_id = "run_" + run
        avgs[run_id] = {}
        for (const perc of trainingPercentages) {
            avgs[run_id][perc] = 0;
        }
        accs[run_id] = {};
        var avg = 0;
        for (const subject of subjects) {
            const subj_id = "subj_" + subject
            accs[run_id][subj_id] = {};
            if (!dataAll[subject]) {
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                console.log("loading data of subject " + subject + " ..")
                dataAll[subject] = collectIV2a([subject], timeseries, trialLengthSecs * frequency, breakLengthSecs * frequency, riemann)[subject];
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
            }
            for (const isReversed of [false, true]) {
                const sessionID = "isReversed_" + isReversed;
                accs[run_id][subj_id][sessionID] = {}

                for (const percentage of trainingPercentages) {
                    const percID = "percentage_" + percentage
                    console.log("--------------------------------------------------------------------------")
                    console.log("TEST RUN " + run + ", SUBJECT " + subject + ", reversed sessions: " + isReversed + ", perc. id: " + percID);

                    // const hdc = new HdcCiMHrr(basicSettings, riemann);
                    const hdc = new HdcHersche(basicSettings.nBands, basicSettings.nChannels, basicSettings.classLabels, Encodings.THERMOMETER, { q: 787 }, riemann);
                    const data = get_data(dataAll[subject], isReversed);

                    console.log("fitting hdc ..")
                    const shuffledIndeces = balancedShuffle(data.train_labels, [1, 2, 3]);
                    const nTrainingTrials = Math.floor(percentage * shuffledIndeces.length);
                    for (var trialIdx = 0; trialIdx < nTrainingTrials; trialIdx++) { 
                        const i = shuffledIndeces[trialIdx];
                        hdc.collectTrial(data.train_data[i].trial, data.train_labels[i] - 1); 
                    }
                    await hdc.fit();

                    var nCorrects = 0;
                    for (const trialIdx of tqdm(arange(0, data.benchmark_data.length), { logging: true })) {
                        const trialTensor = data.benchmark_data[trialIdx];
                        const [probs, runtimes] = await hdc.predict(trialTensor.trial);
                        const pred = maxIdx(probs)
                        nCorrects += pred == (data.benchmark_labels[trialIdx] - 1);
                        hdc._riemannKernel.updateMean(trialTensor.trial, 4);
                    }
                    const acc = nCorrects / data.benchmark_data.length; // data.benchmark_data.length
                    console.log("cross sesh acc: " + acc);
                    console.log("--------------------------------------------------------------------------")

                    accs[run_id][subj_id][sessionID][percID] = acc;
                    avgs[run_id][percentage] += acc / (2 * trainingPercentages.length * subjects.length)
                }
                saveAsJSON(accs, "cache/" + experimentID);
            }
        }
        console.log(avgs);
    }
    saveAsJSON(accs, experimentID);
}
