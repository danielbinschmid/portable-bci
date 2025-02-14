/**
 * Experiment to validate CiM HDC model
 */

import { SETTINGS } from  "../../../tools/hdc/hdcCiMBase";
import { HdcCiMBsc } from "../../../tools/hdc/hdcCiMBsc";
import { HdcCiMHrr } from "../../../tools/hdc/hdcCiMHrr";
import { HdcHersche, Encodings } from "../../../tools/hdc/hdchersche";
import { collectIV2a, loadCached } from "../../data_utils/readIV2a";
import { Riemann } from "../../../tools/riemann/riemann";
import { maxIdx, arange, flatten3 } from "../../data_utils/array_utils";
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm
import { saveAsJSON } from "../../data_utils/save_benchmarks";

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

    const nRuns = 10;
    const timeseries = riemann.Timeseries(basicSettings.nChannels, basicSettings.nBands, frequency, trialLengthSecs * frequency);

    const experimentID = "hdc_hersche"
    // -------------------------

    var dataAll = {};
    if (cached) {dataAll = loadCached(riemann, subjects); }

    const accs = {};

    for (var run = 0; run < nRuns; run++) {
        const run_id = "run_" + run
        accs[run_id] = {};
        var avg = 0;
        for (const subject of subjects) {
            const subj_id = "subj_" + subject
            accs[run_id][subj_id] = {};
            if (!dataAll[subject]) 
            { 
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                console.log("loading data of subject " + subject + " ..")
                dataAll[subject] = collectIV2a([subject], timeseries, trialLengthSecs * frequency, breakLengthSecs * frequency, riemann)[subject];
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
            }
            for (const isReversed of [false, true]) {
                const sessionID = "isReversed_" + isReversed;
                console.log("--------------------------------------------------------------------------")
                console.log("TEST RUN " + run + ", SUBJECT "+ subject + ", reversed sessions: " + isReversed);

                // const hdc = new HdcCiMHrr(basicSettings, riemann);
                const hdc = new HdcHersche(basicSettings.nBands, basicSettings.nChannels, basicSettings.classLabels, Encodings.THERMOMETER, { q: 787}, riemann);
                const data = get_data(dataAll[subject], isReversed);

                console.log("fitting hdc ..")
                for (var trialIdx = 0; trialIdx < data.train_data.length; trialIdx++) { hdc.collectTrial(data.train_data[trialIdx].trial, data.train_labels[trialIdx] - 1); }
                await hdc.fit();
                 
                var nCorrectsTrain = 0;
                for (const trialIdx of tqdm(arange(0, data.train_data.length), {logging: true} )) 
                {
                    const trialTensor = data.train_data[trialIdx];
                    const [probs, runtimes] = await hdc.predict(trialTensor.trial);
                    const pred = maxIdx(probs)
                    nCorrectsTrain += pred == (data.train_labels[trialIdx] - 1);
                }
                const trainAcc = nCorrectsTrain / data.train_data.length; // data.benchmark_data.length
                 
                var nCorrects = 0;
                for (const trialIdx of tqdm(arange(0, data.benchmark_data.length), {logging: true} )) 
                {
                    const trialTensor = data.benchmark_data[trialIdx];
                    const [probs, runtimes] = await hdc.predict(trialTensor.trial);
                    const pred = maxIdx(probs)
                    nCorrects += pred == (data.benchmark_labels[trialIdx] - 1);
                    hdc._riemannKernel.updateMean(trialTensor.trial, 4);
                }
                const acc = nCorrects / data.benchmark_data.length; // data.benchmark_data.length
                console.log("cross sesh acc: " + acc + ", train acc: " + trainAcc);
                console.log("--------------------------------------------------------------------------")

                accs[run_id][subj_id][sessionID] = acc;
                avg += acc / (subjects.length * 2)
 
            }
            saveAsJSON(accs, "cache/" + experimentID);
        }
        console.log("Avg: " + avg);
    }    
    saveAsJSON(accs, experimentID);
}

export default evaluate;
