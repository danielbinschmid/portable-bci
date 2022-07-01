import * as tf from '@tensorflow/tfjs-node-gpu';
import { SETTINGS } from "../../tools/hdc/hdcCiMBase";
import { HdcCiMBsc } from "../../tools/hdc/hdcCiMBsc";
import { HdcCiMHrr } from "../../tools/hdc/hdcCiMHrr";
import { HdcHersche, Encodings } from "../../tools/hdc/hdchersche";
import { collectIV2a, loadCached } from "../data_utils/readIV2a";
import { Riemann } from "../../tools/riemann/riemann";
import { maxIdx, arange, flatten3, shuffle, shuffle2 } from "../data_utils/array_utils";
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

    const nRuns = 10;
    const timeseries = riemann.Timeseries(basicSettings.nChannels, basicSettings.nBands, frequency, trialLengthSecs * frequency);

    const experimentID = "hdcHRR_subjectTransfer"
    // -------------------------

    var dataAll = {};
    if (cached) {dataAll = loadCached(riemann, subjects); }

    const accs = {};

    for (var run = 0; run < nRuns; run++) {
        for (const isReversed of [false, true]) {
            const sessionID = "isReversed_" + isReversed;
            const run_id = "run_" + run
            accs[run_id] = {};
            
            // prefit to all subjects
            const hdc = new HdcCiMHrr(basicSettings, riemann);
            const pretrainingData = [];
            const pretrainingLabels = [];
            for (const subject of subjects) {
                const data = get_data(dataAll[subject], isReversed);
                pretrainingData.push(data.train_data);
                pretrainingLabels.push(data.train_labels);
            }

            await hdc.preFitToSubjects(pretrainingData, pretrainingLabels);
            const AM_pretrain = hdc._AM.unstack();
            hdc._AM.print()

            // classify all subjects
            console.log("benchmarking")
            var totalAcc = 0
            for (const subject of subjects) {
                hdc.clear();
                const data = get_data(dataAll[subject], isReversed);

                // orientate riemann reference point
                const subjLabelsConverted = []
                for (const trialIdx of arange(0, data.benchmark_data.length)) 
                {
                    subjLabelsConverted.push(data.benchmark_labels[trialIdx] - 1);
                    const trialTensor = data.benchmark_data[trialIdx];
                    hdc.collectTrial(trialTensor.trial, data.benchmark_labels[trialIdx] - 1);
                }
                const buff = riemann.ArrayBuffer();
                hdc._riemannKernel.fitTrials(buff);
                const subjectBatch = hdc._encodeBatch(buff, data.benchmark_data.length)
                const acc = hdc._predictBatch(subjectBatch, subjLabelsConverted, hdc._AM);

                console.log("cross sesh acc: " + acc + " on subject " + subject);
                totalAcc += acc;
            }
            console.log("total cross session accuracy: " + (totalAcc / subjects.length));

            // subject inidividual retraining
            for (const subject of subjects) {
                const subj_id = "subj_" + subject;

                hdc.clear();
                // hdc._AM = tf.stack(AM_pretrain);
                // hdc._AM.print()
                
                const data = get_data(dataAll[subject], isReversed);
                const train_data = data.train_data;
                const train_labels = data.train_labels;
                for (var trialIdx = 0; trialIdx < train_data.length; trialIdx++) { hdc.collectTrial(train_data[trialIdx].trial, train_labels[trialIdx] - 1); }

                const trainingAcc = await hdc.retrain(20, 0.1);

                var nCorrects = 0;
                for (const trialIdx of tqdm(arange(0, data.benchmark_data.length), {logging: true} )) 
                {
                    const trialTensor = data.benchmark_data[trialIdx];
                    const probs = await hdc.predict(trialTensor.trial);
                    const pred = maxIdx(probs)
                    nCorrects += pred == (data.benchmark_labels[trialIdx] - 1);
                }
                const acc = nCorrects / data.benchmark_data.length; // data.benchmark_data.length
                console.log("cross sesh acc: " + acc + ", training set acc: " + trainingAcc);

            }
            // saveAsJSON(accs, "cache/" + experimentID);
        }
    }    
    // saveAsJSON(accs, experimentID);
}