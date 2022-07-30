/**
 * Supervised online adaption, if subject data is available from a previous session
 */

import { SETTINGS, HdcCiMBase } from "../../tools/hdc/hdcCiMBase";
import * as tf from '@tensorflow/tfjs-node-gpu';
import { HdcCiMBsc } from "../../tools/hdc/hdcCiMBsc";
import { HdcCiMHrr } from "../../tools/hdc/hdcCiMHrr";
import { HdcCiMfHrr } from "../../tools/hdc/hdcCiMfHrr";
import { HdcHersche, Encodings } from "../../tools/hdc/hdchersche";
import { collectIV2a, loadCached } from "../data_utils/readIV2a";
import { Riemann } from "../../tools/riemann/riemann";
import { maxIdx, arange, flatten3, shuffle } from "../data_utils/array_utils";
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

function logDivider() {
    console.log("--------------------------------------------------------------------------");
}

/**
 * 
 * @param {*} configProportionAdaptionData 
 * @param {number[]} shuffledIndeces 
 * @returns {*}
 */
function getCycleIndeces(configProportionAdaptionData, shuffledIndeces) {
    const proportion = configProportionAdaptionData.proportion;
    const nCycles = configProportionAdaptionData.nCycles;
    const nTrials = shuffledIndeces.length;

    const nAdaptionTrials = Math.floor(proportion * nTrials);
    const indecesCollection = []
    for (const cycle of arange(0, nCycles)) {
        const adaptIndeces = []
        const benchmarkIndeces = []
        const startTrial = cycle * nAdaptionTrials < nTrials? cycle * nAdaptionTrials: nTrials - nAdaptionTrials;

        for (const trialIdx of arange(0, nTrials)) {
            if (trialIdx >= startTrial && trialIdx < startTrial + nAdaptionTrials)
            {
                adaptIndeces.push(shuffledIndeces[trialIdx]);
            } 
            else 
            {
                benchmarkIndeces.push(shuffledIndeces[trialIdx]);
            }
        }

        indecesCollection.push({
            adapt: adaptIndeces,
            benchmark: benchmarkIndeces
        })
    }
    return indecesCollection;
}

 /**
 * 
 * @param {Riemann} riemann 
 */
export async function evaluate(riemann) {
    // --------- CONFIG ---------
    const subjects = arange(2, 10)
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

    const experimentID = "onlineCrossSessionAdaption_noRiemannRefChange_12its_0-01lr"

    const configsProportionAdaptionData = [
        {proportion: 0.5, nCycles: 2},
        {proportion: 0.2, nCycles: 2},
        {proportion: 0.15, nCycles: 2},
        {proportion: 0.1, nCycles: 2},  
        {proportion: 0.05, nCycles: 10},  
            
    ]
    // -------------------------

    var dataAll = {};
    if (cached) {dataAll = loadCached(riemann, subjects); }

    const accs = {};

    for (var run = 0; run < nRuns; run++) {
        const run_id = "run_" + run
        accs[run_id] = {};
        for (const subject of subjects) {
            const subj_id = "subj_" + subject
            accs[run_id][subj_id] = {};
            for (const isReversed of [false, true]) {
                const sessionID = "isReversed_" + isReversed;
                accs[run_id][subj_id][sessionID] = {};

                logDivider()
                console.log("TEST RUN " + run + ", SUBJECT "+ subject + ", reversed sessions: " + isReversed);

                const data = get_data(dataAll[subject], isReversed);

                const hdc = new HdcCiMfHrr(basicSettings, riemann);
                console.log("_________PRETRAINING_________")
                console.log("fitting hdc ..")
                for (var trialIdx = 0; trialIdx < data.train_data.length; trialIdx++) { hdc.collectTrial(data.train_data[trialIdx].trial, data.train_labels[trialIdx] - 1); }
                const trainingAcc = await hdc.fit(true, 1, true, 5);
                const preTrainAcc = await computeAcc(data.benchmark_data, data.benchmark_labels, arange(0, data.benchmark_data.length), hdc);
                console.log("pretrain cross sesh acc: " + preTrainAcc);
                accs[run_id][subj_id][sessionID]["pretrain_ref_acc"] = preTrainAcc;

                console.log("_________PRETRAINING_END_________")
                const preTrainAM = hdc._AM.unstack();

                const shuffledIndeces = arange(0, data.benchmark_data.length);
                shuffle(shuffledIndeces);

                for (const configProportionAdaptionData of configsProportionAdaptionData) {
                    console.log("_________PROPORTION_START_________")
                    const adaptionConfigID = "proportion_" + configProportionAdaptionData.proportion;
                    console.log(adaptionConfigID);

                    accs[run_id][subj_id][sessionID][adaptionConfigID] = []
                    const cycles = getCycleIndeces(configProportionAdaptionData, shuffledIndeces);

                    for (const cycleIdx of arange(0, cycles.length))  {
                        console.log("**** cycle " + cycleIdx + " ****")
                        const cycleIndeces = cycles[cycleIdx];
                        const adaptIndeces = cycleIndeces.adapt;
                        const benchmarkIndeces = cycleIndeces.benchmark;

                        hdc._AM = tf.stack(preTrainAM);
                        const accBefore = await computeAcc(data.benchmark_data, data.benchmark_labels, benchmarkIndeces, hdc);
                        console.log("benchmark accuracy before retraining: " + accBefore);
                        for (const trialIdx of adaptIndeces) { hdc.collectRetrainTrial(data.benchmark_data[trialIdx].trial, data.benchmark_labels[trialIdx] - 1, data.benchmark_data[trialIdx].break_); }
                        const retrainAcc = await hdc.refit()// await hdc.retrain(5, 0.1); // 5, 0.1 yields good results

                        const acc = await computeAcc(data.benchmark_data, data.benchmark_labels, benchmarkIndeces, hdc);
                        console.log("benchmark acc: " + acc);

                        accs[run_id][subj_id][sessionID][adaptionConfigID].push(acc);
                        console.log("**** cycle end ****")
                    }
                    console.log("_________PROPORTION_END_________")
                    saveAsJSON(accs, "cache/" + experimentID);
                }
                logDivider()
            }
            
        }
    }    
    saveAsJSON(accs, experimentID);
}

/**
 * 
 * @param {*} data 
 * @param {*} labels 
 * @param {*} indeces 
 * @param {HdcCiMBase} hdc 
 * @returns 
 */
async function computeAcc(data, labels, indeces, hdc) {
    var nCorrects = 0;
    for (const trialIdx of indeces) 
    {
        const trialTensor = data[trialIdx];
        const probs = await hdc.predict(trialTensor.trial);
        const pred = maxIdx(probs)
        nCorrects += pred == (labels[trialIdx] - 1);
        hdc._riemannKernel.updateMean(trialTensor.trial, 4)
    }
    const acc = nCorrects / indeces.length; // data.benchmark_data.length
    return acc
}
