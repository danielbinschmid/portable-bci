/**
 * Experiment to validate CiM HDC model
 */

import { SETTINGS } from "../../tools/hdc/hdcCiMBase";
import { HdcCiMBsc } from "../../tools/hdc/hdcCiMBsc";
import { HdcCiMfHrr } from "../../tools/hdc/hdcCiMfHrr";
import { HdcHersche, Encodings } from "../../tools/hdc/hdchersche";
import { collectIV2a, loadCached } from "../data_utils/readIV2a";
import { Riemann } from "../../tools/riemann/riemann";
import { maxIdx, arange, flatten3, balancedShuffle } from "../data_utils/array_utils";
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm
import { saveAsJSON } from "../data_utils/save_benchmarks";

function get_data(data, isReversed, trainingPerc) {
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
    const trainIndeces = balancedShuffle(data_.train_labels, [1, 2, 3])

    const train_data = []
    const train_labels = []

    for (const i of arange(0, Math.floor(trainingPerc * trainIndeces.length))) {
        train_data.push(data_.train_data[trainIndeces[i]])
        train_labels.push(data_.train_labels[trainIndeces[i]])
    }

    data_.train_data = train_data
    data_.train_labels = train_labels
    
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
    const percentages_training = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1]

    const basicSettings = {
            nBands: 43,
            nChannels: 4,
            hdDim: 10000,
            classLabels: [0, 1, 2],
            useTSpaceNGrams: false
    }

    const nRuns = 10;
    const timeseries = riemann.Timeseries(basicSettings.nChannels, basicSettings.nBands, frequency, trialLengthSecs * frequency);

    const experimentID = "fhrr_partialTraining"
    // -------------------------

    var dataAll = {};
    if (cached) {dataAll = loadCached(riemann, subjects); }

    const accs = {};

    for (var run = 0; run < nRuns; run++) {
        const run_id = "run_" + run
        accs[run_id] = {};
        for (const percentage_training of percentages_training) {
            const partialTrainingID = "partialTraining_" + percentage_training
            accs[run_id][partialTrainingID] = {}
            for (const subject of subjects) {
                const subj_id = "subj_" + subject
                accs[run_id][partialTrainingID][subj_id] = {};
                var avg = 0;
                for (const isReversed of [false, true]) {
                    const sessionID = "isReversed_" + isReversed;
                    console.log("--------------------------------------------------------------------------")
                    console.log("TEST RUN " + run + ", SUBJECT "+ subject + ", reversed sessions: " + isReversed);
    
                    const hdc = new HdcCiMfHrr(basicSettings, riemann);
                    
                    // const hdc = new HdcHersche(basicSettings.nBands, basicSettings.nChannels, basicSettings.classLabels, Encodings.THERMOMETER, { q: 2 * 393}, riemann);
                    const data = get_data(dataAll[subject], isReversed, percentage_training);
    
                    console.log("fitting hdc ..")
                    for (var trialIdx = 0; trialIdx < data.train_data.length; trialIdx++) { hdc.collectTrial(data.train_data[trialIdx].trial, data.train_labels[trialIdx] - 1); }
                    const trainingAcc = await hdc.fit(true, 1, false);
                     
                    var nCorrects = 0;
                    for (const trialIdx of tqdm(arange(0, data.benchmark_data.length), {logging: true} )) 
                    {
                        const trialTensor = data.benchmark_data[trialIdx];
                        const probs = await hdc.predict(trialTensor.trial);
                        const pred = maxIdx(probs)
                        nCorrects += pred == (data.benchmark_labels[trialIdx] - 1);
                        hdc._riemannKernel.updateMean(data.benchmark_data[trialIdx].trial, 4)
                    }
                    const acc = nCorrects / data.benchmark_data.length; // data.benchmark_data.length
                    console.log("cross sesh acc: " + acc + ", training set acc: " + trainingAcc);
                    console.log("--------------------------------------------------------------------------")
    
                    accs[run_id][partialTrainingID][subj_id][sessionID] = acc;
                    avg += acc / (subjects.length * 2)
     
                }
                saveAsJSON(accs, "cache/" + experimentID);
            }
            console.log("avg: " + avg);
        }
        
        
    }    
    saveAsJSON(accs, experimentID);
}

export function analyzeQuantization(riemann) {
    // --------- CONFIG ---------
    const subjects = arange(1, 10)
    const frequency = 250;
    const trialLengthSecs = 3.5;
    const breakLengthSecs = 2.5;

    const basicSettings = {
            nBands: 43,
            nChannels: 4,
            hdDim: 10000,
            classLabels: [0, 1, 2],
            useTSpaceNGrams: false
    }
    const subject = 1;

    const nRuns = 10;
    const timeseries = riemann.Timeseries(basicSettings.nChannels, basicSettings.nBands, frequency, trialLengthSecs * frequency);

    const experimentID = "hdcRiemannCiM"

    const data = collectIV2a([subject], timeseries, trialLengthSecs * frequency, breakLengthSecs * frequency, riemann)[subject];
    const hdc = new HdcCiMHrr(basicSettings, riemann);

    for (var trialIdx = 0; trialIdx < data.train_data.length; trialIdx++) { hdc.collectTrial(data.train_data[trialIdx].trial, data.train_labels[trialIdx] - 1); }

    var arr = hdc.getQuanitizedTrials()
    arr = flatten3(arr);
    
    const boxes = []
    for (const i of arange(0, 101)) {
        boxes.push(0)
    }

    for (const el of arr) {
        boxes[el] += 1;
    }

    var i = 0;
    for (const box of boxes) {
        console.log(box + " number of elements for " + i);
        i++;
    }   
}

export default evaluate;