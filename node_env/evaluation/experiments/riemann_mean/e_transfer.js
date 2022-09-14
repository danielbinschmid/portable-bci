/**
 * Successful cross session Riemann adaption
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

    const experimentID = "transfer_refChangeWeight-4"
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
                console.log("--------------------------------------------------------------------------")
                console.log("TEST RUN " + run + ", SUBJECT "+ subject + ", reversed sessions: " + isReversed);

                const hdc = new HdcCiMHrr(basicSettings, riemann);
                
                // const hdc = new HdcHersche(basicSettings.nBands, basicSettings.nChannels, basicSettings.classLabels, Encodings.THERMOMETER, { q: 2 * 393}, riemann);
                const data = get_data(dataAll[subject], isReversed);

                console.log("fitting hdc ..")
                for (var trialIdx = 0; trialIdx < data.train_data.length; trialIdx++) { hdc.collectTrial(data.train_data[trialIdx].trial, data.train_labels[trialIdx] - 1); }
                const trainingAcc = await hdc.fit(true);
                 
                var nCorrectsAdapted = 0;
                var nCorrectsRef = 0
                var nCorrectsOptimal = 0
                var nCorrectsOptimalBreaks = 0;

                const oldKernel = hdc._riemannKernel;
                const newKernel = riemann.RiemannKernel();
                newKernel.setMeanMetric(riemann.EMetric.Euclidian);
                for (var i = 0; i < data.train_data.length; i++) {newKernel.addBreak(data.train_data[i].trial); }
                newKernel.fitBreaks();

                const optimalKernel = riemann.RiemannKernel();
                optimalKernel.setMeanMetric(riemann.EMetric.Euclidian);
                for (var i = 0; i < data.benchmark_data.length; i++) {
                    // optimalKernel.addBreak(data.benchmark_data[i].break_); 
                    optimalKernel.addBreak(data.benchmark_data[i].trial); 
                }
                optimalKernel.fitBreaks();

                const optimalKernelBreaks = riemann.RiemannKernel();
                optimalKernelBreaks.setMeanMetric(riemann.EMetric.Euclidian);
                for (var i = 0; i < data.benchmark_data.length; i++) {
                    optimalKernelBreaks.addBreak(data.benchmark_data[i].break_); 
                    optimalKernelBreaks.addBreak(data.benchmark_data[i].trial); 
                }
                optimalKernelBreaks.fitBreaks();
                
                const nBenchmark = data.benchmark_data.length;
                for (const trialIdx of tqdm(arange(0, nBenchmark), {logging: true} )) 
                {   
                    hdc._riemannKernel = oldKernel;
                    const trialTensor = data.benchmark_data[trialIdx];
                    const probsRef = await hdc.predict(trialTensor.trial);
                    const predRef = maxIdx(probsRef)
                    nCorrectsRef += predRef == (data.benchmark_labels[trialIdx] - 1);

                    hdc._riemannKernel = optimalKernel;
                    const probsOptimal = await hdc.predict(trialTensor.trial);
                    const predOptimal = maxIdx(probsOptimal)
                    nCorrectsOptimal += predOptimal == (data.benchmark_labels[trialIdx] - 1);

                    hdc._riemannKernel = optimalKernelBreaks;
                    const probsOptimalBreaks = await hdc.predict(trialTensor.trial);
                    const predOptimalBreaks = maxIdx(probsOptimalBreaks)
                    nCorrectsOptimalBreaks += predOptimalBreaks == (data.benchmark_labels[trialIdx] - 1);

                    hdc._riemannKernel = newKernel;
                    // hdc._riemannKernel.updateMean(trialTensor.break_);
                    const probs = await hdc.predict(trialTensor.trial);
                    const pred = maxIdx(probs)
                    nCorrectsAdapted += pred == (data.benchmark_labels[trialIdx] - 1);
                    hdc._riemannKernel.updateMean(trialTensor.trial, 4);
                }
                const accRef = nCorrectsRef / nBenchmark; // data.benchmark_data.length
                const accAdapted = nCorrectsAdapted / nBenchmark; // data.benchmark_data.length
                const accOptimal = nCorrectsOptimal / nBenchmark;
                const accOptimalBreaks = nCorrectsOptimalBreaks / nBenchmark;
                console.log("ref cross sesh acc: " + accRef 
                            + ", training set acc: " + trainingAcc 
                            + ", adapted cross sesh acc: " + accAdapted
                            + ", optimal riemann ref: " + accOptimal 
                            + ", accOptimalBreaks: " + accOptimalBreaks);
                console.log("--------------------------------------------------------------------------")

                accs[run_id][subj_id][sessionID] = {}
                accs[run_id][subj_id][sessionID]["ref_acc"] = accRef;
                accs[run_id][subj_id][sessionID]["adaption_acc"] = accAdapted;
                accs[run_id][subj_id][sessionID]["optimal_riemann_ref"] = accOptimal;
                accs[run_id][subj_id][sessionID]["optimal_riemann_ref_breaks"] = accOptimalBreaks;
            }
            saveAsJSON(accs, "cache/" + experimentID);
        }
    }    
    saveAsJSON(accs, experimentID);
}

export default evaluate

