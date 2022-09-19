import { HdcHersche, Encodings } from "../hdc/hdchersche";
import { arange } from "../../data_utils/array_utils";

import { Riemann, getAllMeanMetrics, EMetric } from "../riemann/riemann";
import { DataConfig, HdcConfig, Data, EvalRunConfig, evalRun } from "./run_eval";
import { genTrials } from "../../data_utils/genData";



/**
 * 
 * @param {string} config 
 * @returns {EvalRunConfig}
 */
function fetchConfig(config) {
    var config_ = {
        addBreaks: false,
        addTrialsToBreaks: false,
        transfer: false
    }

    switch (config) {
        case "no-adaption":
            break;
        case "transfer":
            config_.addBreaks = true;
            config_.addTrialsToBreaks = false;
            config_.transfer = true;
            break;
        default:
            throw "unknown testing config";
    }

    return config_;
}

/**
 * 
 * @param {Riemann} riemann 
 */
async function exec(riemann, vm) {
    // ------------------- CONFIG ---------------------
    const benchmarkFileName = "meanMetricRunTimes";

    // hdc config
    const hdcConfig = {
        classLabels: [0, 1, 2],
        encodingType: Encodings.THERMOMETER,
        encodingConfig: {
            q: 2 * 393
        },
        trainingMeanMetric: undefined,
        transferMeanMetric: undefined
    }

    // data config
    const dataConfig = {
        nBands: 43,
        nChannels: 4,
        frequency: 250,
        nStepsTrial: 3.5 * 250,
        nStepsBreak: 2.5 * 250,
        nTrials: 50
    }

    const config_ = "transfer";

    // evaluation variables and configs
    const trainingMeanMetric = riemann.EMetric.Identity; 
    const transferMeanMetrics = getAllMeanMetrics(riemann); // [riemann.EMetric.ALE, riemann.EMetric.Euclidian, riemann.EMetric.Harmonic, riemann.EMetric.Identity, riemann.EMetric.Kullback, riemann.EMetric.LogDet, riemann.EMetric.LogEuclidian, riemann.EMetric.Riemann, riemann.EMetric.Wasserstein]

    // ------------------- START ----------------------

    console.log("-------- START ----------");

    const timeseries = riemann.Timeseries(dataConfig.nChannels, dataConfig.nBands, dataConfig.frequency, dataConfig.nSteps * 1.2);
    const benchmarks = {};
    console.log("generating data..")
    let genData = genTrials(dataConfig.nTrials, timeseries, dataConfig.nStepsTrial, dataConfig.nStepsBreak, riemann);
    console.log("data generated");

    for (const transferMeanMetric of transferMeanMetrics) {
        const transferMeanMetricID = "transfer_mean_metric_" + riemann.EMetricToString[transferMeanMetric]; 
        console.log("////////////////")
        console.log(transferMeanMetricID);

        const kernel = riemann.RiemannKernel();
        kernel.setMeanMetric(transferMeanMetric);
        if (kernel.getMeanMetric() != transferMeanMetric) { throw "failed to change metric"; }

        const adaptionRuntimes = [];
        for (var trialIdx = 0; trialIdx < 15; trialIdx++) 
        {   
            console.log(trialIdx);
            for (var prevTrialIdx = 0; prevTrialIdx <= trialIdx; prevTrialIdx++) {
                const break_ = genData.train_data[prevTrialIdx].break_;
                kernel.addBreak(break_);
            }
            var now = Date.now();
            kernel.fitBreaks();
            adaptionRuntimes.push(Date.now() - now);
            kernel.reset();
        }

        benchmarks[transferMeanMetricID] = adaptionRuntimes;
        console.log(adaptionRuntimes);
    }

    console.log(benchmarks);
}

export async function benchmarkMeanRuntimes(riemann, vm) {
    exec(riemann, vm);
}