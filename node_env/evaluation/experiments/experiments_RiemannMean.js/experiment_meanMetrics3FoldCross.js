/**
 * Single session 3-fold-cross validation with different Riemann mean metrics.
 */

import { HdcHersche, Encodings } from "../tools/hdc/hdchersche";
import { maxIdx, arange } from "./data_utils/array_utils";

import { Riemann, getAllMeanMetrics, EMetric } from "../tools/riemann/riemann";
import { AdvancedConfig, DataConfigs, Config, evalRun } from "./run_eval";

import { collectIV2a } from "./data_utils/readIV2a";
import { computeSplit } from "./data_utils/kcross_utils";
import { saveAsJSON } from "./data_utils/save_benchmarks";

import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm




function updateDataConfig(data, dataConfigs) {
    dataConfigs.nTrialsBenchmarking = data.test_data.length;
    dataConfigs.train_data = data.train_data;
    dataConfigs.train_labels = data.train_labels;
    return dataConfigs;
}

function fetchConfig(config, data) {
    var addBreaks = false;
    var addTrialsToBreaks = false;
    var benchmark_data = data.test_data;
    var benchmark_labels = data.test_labels;
    var fitToTraining = true;
    var transfer = false;

    switch (config) {
        case "no-adaption":
            break;
        case "break-adaption":
            fitToTraining = false;
            addBreaks = true;
            addTrialsToBreaks = true;
            
            break;
        case "training-trials":
            benchmark_data = data.train_data;
            benchmark_labels = data.train_labels;
            break;
        default:
            throw "unknown testing config";
    }

    return {
        addBreaks: addBreaks,
        addTrialsToBreaks: addTrialsToBreaks,
        benchmark_data: benchmark_data,
        benchmark_labels: benchmark_labels,
        fitToTraining: fitToTraining,
        transfer: 
    }
}

/**
 * 
 * @param {Riemann} riemann 
 */
async function hdc_full(riemann) {
    // ------------------- CONFIG ---------------------
    const benchmarkFileName = "meanMetricAccuracies";

    // hdc configs
    const classLabels = [0, 1, 2];
    const encodingType = Encodings.THERMOMETER;
    const encodingConfig = {
        q: 2 * 393, // must be provided by input
    };


    // data configs
    const frequency = 250;
    var dataConfigs = {
        nBands : 43,
        nChannels : 4,
        frequency : frequency,
        nSteps : 3.5 * frequency,
        tShift : 2.5 * frequency,
        classLabels: classLabels,
        encodingType: encodingType,
        encodingConfig: encodingConfig
    }

    const nTestRuns = 5;
    const subjects = arange(1, 10);
    
    const kFoldCross = true;
    const k = 3;

    // evaluation variables and configs
    const configs = ["no-adaption"] // "no-adaption", "break-adaption", "training-trials"
    const meanMetrics = getAllMeanMetrics(riemann); // [riemann.EMetric.ALE, riemann.EMetric.Euclidian, riemann.EMetric.Harmonic, riemann.EMetric.Identity, riemann.EMetric.Kullback, riemann.EMetric.LogDet, riemann.EMetric.LogEuclidian, riemann.EMetric.Riemann, riemann.EMetric.Wasserstein]


    // ------------------- START ----------------------

    console.log("-------- START ----------");

    const timeseries = riemann.Timeseries(dataConfigs.nChannels, dataConfigs.nBands, dataConfigs.frequency, dataConfigs.nSteps * 1.2);
    const benchmarks = {};
    let dataAll = {};

    for (const testRunIdx of arange(0, nTestRuns)) {
        console.log("------------ TEST RUN " + testRunIdx.toString() + " ------------");
        const test_id = "test_run_" + testRunIdx.toString(); 
        benchmarks[test_id] = {};

        for (const subject of subjects) {
            console.log("------------ SUBJECT " + subject.toString() + " ------------");
            const subj_id = "subj_" + subject.toString();
            benchmarks[test_id][subj_id] = {};

            if (!dataAll[subject]) {
                console.log("collecting data for subject..");
                dataAll[subject] = collectIV2a([subject], timeseries, dataConfigs.nSteps, dataConfigs.tShift, riemann)[subject];
            }
            const dataSubj = dataAll[subject];

            var dataSplits = [];
            if (kFoldCross) {
                dataSplits = computeSplit(dataSubj, k);
            } else {
                dataSplits = [dataSubj];
            }

            for (const meanMetric of meanMetrics) {
                const meanMetricID = riemann.EMetricToString[meanMetric]; 
                benchmarks[test_id][subj_id][meanMetricID] = {};
            
                for (const config_ of configs) {
                    benchmarks[test_id][subj_id][meanMetricID][config_] = {};

                    var fold = 0;
                    for (const data of dataSplits) {
                        fold += 1;
                        const fold_id = "fold_" + fold.toString();

                        console.log("////////////////")
                        console.log("mean metric: " + meanMetricID);
                        console.log("config: " + config_);
                        console.log("subject:" + subject.toString());
                        console.log("fold: " + fold.toString()+ "/" + dataSplits.length);

                        const config = fetchConfig(config_, data);
                        dataConfigs = updateDataConfig(data, dataConfigs);

                        const acc = await evalRun(dataConfigs, {config: config, meanMetric: meanMetric}, riemann);
                        console.log("accuracy: " + acc.toString());
                        benchmarks[test_id][subj_id][meanMetricID][config_][fold_id] = acc;

                    }
                }
            }
            saveAsJSON(benchmarks, "cache/" + benchmarkFileName);
        }
        saveAsJSON(benchmarks, "cache/" + benchmarkFileName);
    }
    saveAsJSON(benchmarks, benchmarkFileName);
}

export async function evaluate(riemann) {
    hdc_full(riemann);
}