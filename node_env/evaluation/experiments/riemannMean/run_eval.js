import { HdcHersche, Encodings } from "../../../tools/hdc/hdchersche";
import { maxIdx, arange } from "../../data_utils/array_utils";

import { Riemann, getAllMeanMetrics, EMetric } from "../../../tools/riemann/riemann";

import { collectIV2a } from "../../data_utils/readIV2a";
import { computeSplit } from "../../data_utils/kcross_utils";
import { saveAsJSON } from "../../data_utils/save_benchmarks";

import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm

/**
 * 
 * @param {HdcHersche} hdc 
 * @param {Timeseries_d} timeseries 
 * @param {number[][][]} train_data 
 * @param {number[]} train_labels 
 * @param {number} nTimesteps
 */
async function fitToTrials(hdc, train_data, train_labels, nTimesteps) {

    for (const trialIdx of arange(0, train_data.length)) {
        const trialTensor = train_data[trialIdx].trial;
        const label = train_labels[trialIdx] - 1;

        if (trialTensor.length != nTimesteps) {
            throw "timetensor has not desired number of timesteps"
        }

        hdc.collectTrial(trialTensor, label);
    }
    console.log("fit hdc..");
    const runtimes = await hdc.fit();
}


/**
 * @interface
 */
export var DataConfig = {
    nBands: 0,
    nChannels: 0,
    frequency: 0,
    nStepsTrial: 0,
    nStepsBreak: 0
};

export var HdcConfig = {
    classLabels: [0, 1, 2],
    encodingType: Encodings,
    encodingConfig: {},
    trainingMeanMetric: EMetric,
    transferMeanMetric: EMetric
}

export var Data = {
    train_data: [{
        /** @type {Timetensor_d} */
        break_: null, 
        /** @type {Timetensor_d} */
        trial: null
    }],
    train_labels: [1],
    benchmark_data: [{
        /** @type {Timetensor_d} */
        break_: null, 
        /** @type {Timetensor_d} */
        trial: null}],
    benchmark_labels: [1]
}

export var EvalRunConfig = {
    addBreaks: false,
    addTrialsToBreaks: false,
    transfer: false,
    transferNBreaksMemory: 0,
    transferAdaptionBaseline: false
}



/**
 * 
 * @param {DataConfig} dataConfig 
 * @param {HdcConfig} hdcConfig
 * @param {Data} data 
 * @param {EvalRunConfig} evalRunConfig 
 * @param {Riemann} riemann 
 * @returns 
 */
export async function evalRun(dataConfig, hdcConfig, data, evalRunConfig, riemann) {

    // configure hdc and riemann kernel
    const hdc = new HdcHersche(dataConfig.nBands, dataConfig.nChannels, hdcConfig.classLabels, hdcConfig.encodingType, hdcConfig.encodingConfig, riemann);
    hdc._riemannKernel.setMeanMetric(hdcConfig.trainingMeanMetric);
    console.log("set mean metric to: " + riemann.EMetricToString[hdc._riemannKernel.getMeanMetric()]);
    if (hdc._riemannKernel.getMeanMetric() != hdcConfig.trainingMeanMetric) { throw "changing mean metric did not work"; }

    // fit to training data
    console.log("number of training trials: " + data.train_data.length);
    await fitToTrials(hdc, data.train_data, data.train_labels, dataConfig.nStepsTrial);

    if (hdcConfig.transferMeanMetric != hdcConfig.trainingMeanMetric) {
        hdc._riemannKernel.setMeanMetric(hdcConfig.transferMeanMetric);
        console.log("set transfer mean metric to: " + riemann.EMetricToString[hdc._riemannKernel.getMeanMetric()]);
        if (hdc._riemannKernel.getMeanMetric() != hdcConfig.transferMeanMetric) { throw "changing mean metric did not work"; }
    }

    if (evalRunConfig.transferAdaptionBaseline) {
        hdc._riemannKernel.reset();
        for (const trialIdx of arange(0, data.benchmark_data.length)) {
            const trialTensor = data.benchmark_data[trialIdx].trial;
            const label = data.benchmark_labels[trialIdx] - 1;
    
            if (trialTensor.length != dataConfig.nStepsTrial) {
                throw "timetensor has not desired number of timesteps"
            }
    
            hdc._riemannKernel.addBreak(trialTensor);
        }
        console.log("computing mean for second session..");
        var now = Date.now();
        hdc._riemannKernel.fitBreaks();
        console.log("needed " + (Date.now() - now) + " milliseconds");
    }

    console.log("predicting..");
    var nCorrectPreds = 0;
    const nTrialsBenchmarking = data.benchmark_data.length;
    const adaptionResponseMillis = []
    for (const trialIdx of tqdm(arange(0, nTrialsBenchmarking), { logging: true })) {
        const trial = data.benchmark_data[trialIdx];
        const label = data.benchmark_labels[trialIdx] - 1;

        // adapt to new session
        if (evalRunConfig.transfer) {
            if (!(trialIdx == 0 && !evalRunConfig.addBreaks)) {
                // collect breaks
                // add break
                hdc._riemannKernel.reset();
                const begin_ = trialIdx - evalRunConfig.transferNBreaksMemory > 0 ? trialIdx - evalRunConfig.transferNBreaksMemory: 0;
                for (var prevTrialIdx = begin_; prevTrialIdx <= trialIdx; prevTrialIdx++) {
                    const prevTrial = data.benchmark_data[trialIdx];
                    if (evalRunConfig.addBreaks) {
                        const breakTensor = prevTrial.break_;
                        if (breakTensor.length != dataConfig.nStepsBreak) { throw "break has not desired number of timesteps" }
                        hdc.collectBreak(breakTensor);
                    }
                    if (evalRunConfig.addTrialsToBreaks && prevTrialIdx < trialIdx) {
                        hdc.collectBreak(prevTrial.trial);
                    }
                }
                const adaptionTime = await hdc.adaptToBreaks(); 
                adaptionResponseMillis.push(adaptionTime);
            } 
            
        }

        // get trial
        const trialTensor = trial.trial;
        if (trialTensor.length != dataConfig.nStepsTrial) { throw "timetensor has not desired number of timesteps" }

        // prediction
        var [y, measures] = await hdc.predict(trialTensor);
        const predIdx = maxIdx(y);
        if (predIdx == label) { nCorrectPreds += 1; }

    }

    hdc.destroy();
    const acc = nCorrectPreds / nTrialsBenchmarking;
    const benchmarks = {
        accuracy: acc,
        adaptionRuntimes: adaptionResponseMillis
    }
    return benchmarks;
}