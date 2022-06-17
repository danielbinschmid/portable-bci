import { HdcHersche, Encodings } from "../tools/hdc/hdchersche";
import { maxIdx, arange } from "./data_utils/array_utils";

import { Riemann, getAllMeanMetrics, EMetric } from "../tools/riemann/riemann";
import { DataConfig, HdcConfig, Data, EvalRunConfig, evalRun } from "./run_eval";

import { collectIV2a } from "./data_utils/readIV2a";
import { computeSplit } from "./data_utils/kcross_utils";
import { saveAsJSON } from "./data_utils/save_benchmarks";

import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm

function switchData(dataSubj) {
    const n = {
        train_data: dataSubj.benchmark_data,
        train_labels: dataSubj.benchmark_labels,
        benchmark_data: dataSubj.train_data,
        benchmark_labels: dataSubj.train_labels
    }
    return n
}


/**
 * 
 * @param {string} config 
 * @returns {EvalRunConfig}
 */
function fetchConfig(config) {
    var config_ = {
        addBreaks: false,
        addTrialsToBreaks: false,
        transfer: false,
        transferAdaptionBaseline: false
    }

    switch (config) {
        case "no-transfer":
            break;
        case "transfer":
            config_.addBreaks = true;
            config_.addTrialsToBreaks = true;
            config_.transfer = true;
            break;
        case "transfer-no-breaks":
            config_.addBreaks = false;
            config_.addTrialsToBreaks = true;
            config_.transfer = true;
            break;
        case "transfer-baseline":
            config_.transferAdaptionBaseline = true;
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
async function exec(riemann) {
    // ------------------- CONFIG ---------------------
    const benchmarkFileName = "transferEuclSubj1";

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
        nStepsBreak: 2.5 * 250
    }

    const nTestRuns = 5;
    const subjects = [1];
    const kFoldCross = false;
    const k = 2;

    // evaluation variables and configs
    const configs = ["transfer"] // "no-transfer", "transfer", "transfer-baseline", "transfer-no-breaks"
    const transferNBreaksMemories = [250] 
    const sameMetric = true; // will priorize transfer mean metric getAllMeanMetrics(riemann)
    const trainingMeanMetrics = [riemann.EMetric.Euclidian]; // [riemann.EMetric.ALE, riemann.EMetric.Euclidian, riemann.EMetric.Harmonic, riemann.EMetric.Identity, riemann.EMetric.Kullback, riemann.EMetric.LogDet, riemann.EMetric.LogEuclidian, riemann.EMetric.Riemann, riemann.EMetric.Wasserstein]
    const transferMeanMetrics = [riemann.EMetric.Euclidian];

    // ------------------- START ----------------------

    console.log("-------- START ----------");

    const timeseries = riemann.Timeseries(dataConfig.nChannels, dataConfig.nBands, dataConfig.frequency, dataConfig.nSteps * 1.2);
    const benchmarks = {};
    let dataAll = {};

    for (const testRunIdx of arange(0, nTestRuns)) {
        const test_id = "test_run_" + testRunIdx.toString(); 
        benchmarks[test_id] = {};

        for (const subject of subjects) {
            console.log("------------ TEST RUN " + testRunIdx.toString() + " ------------");
            console.log("------------ SUBJECT " + subject.toString() + " ------------");
            const subj_id = "subj_" + subject.toString();
            benchmarks[test_id][subj_id] = {};

            if (!dataAll[subject]) {
                console.log("collecting data for subject..");
                dataAll[subject] = collectIV2a([subject], timeseries, dataConfig.nStepsTrial, dataConfig.nStepsBreak, riemann)[subject];
            }
            const dataSubj = dataAll[subject];

            var dataSplits = [];
            if (kFoldCross) {
                dataSplits = computeSplit(dataSubj, k);
            } else {
                dataSplits = [dataSubj];
            }

            for (const config_ of configs) {
                var transferMeanMetrics_ = transferMeanMetrics;
                if (config_ == "no-transfer" || config_ == "transfer-baseline") { 
                    transferMeanMetrics_ = trainingMeanMetrics; 
                }

                for (const transferMeanMetric of transferMeanMetrics_) {
                    var trainingMeanMetrics_ = trainingMeanMetrics;
                    if (sameMetric) { 
                        trainingMeanMetrics_ = [transferMeanMetric]; 
                    }

                    const transferMeanMetricID = "transfer_mean_metric_" + riemann.EMetricToString[transferMeanMetric]; 
                    benchmarks[test_id][subj_id][transferMeanMetricID] = {};
                    for (const trainingMeanMetric of trainingMeanMetrics_) {

                        const trainingMeanMetricID = "training_mean_metric_" + riemann.EMetricToString[trainingMeanMetric]; 
                        benchmarks[test_id][subj_id][transferMeanMetricID][trainingMeanMetricID] = {};
                        

                        for (const transferNBreaksMemory of transferNBreaksMemories) {
                            const transferNBreaksMemoryID = "memorized_breaks_for_transfer_" + transferNBreaksMemory.toString();

                            hdcConfig.trainingMeanMetric = trainingMeanMetric;
                            hdcConfig.transferMeanMetric = transferMeanMetric;

                            
                            benchmarks[test_id][subj_id][transferMeanMetricID][trainingMeanMetricID][config_] = {};
        
                            var fold = 0;
                            for (var data of dataSplits) {
                                fold += 1;
                                const fold_id = "fold_" + fold.toString();
                                benchmarks[test_id][subj_id][transferMeanMetricID][trainingMeanMetricID][config_][fold_id] = {};
                                for (const switch_ of [true, false]) {
                                    data = switchData(data);
                                    const switch_id = "switch_" + switch_;
            
                                    console.log("////////////////")
                                    console.log(trainingMeanMetricID);
                                    console.log(transferMeanMetricID);
                                    console.log("memory for transfer adaption: " + transferNBreaksMemory);
                                    console.log("config: " + config_);
                                    console.log("subject: " + subject.toString());
                                    console.log("fold: " + fold.toString()+ "/" + dataSplits.length);
            
                                    const evalRunConfig = fetchConfig(config_);
                                    evalRunConfig.transferNBreaksMemory = transferNBreaksMemory;
        
                                    const benchmarksRun = await evalRun(dataConfig, hdcConfig, data, evalRunConfig, riemann);
                                    console.log("accuracy: " + benchmarksRun.accuracy.toString());
                                    benchmarks[test_id][subj_id][transferMeanMetricID][trainingMeanMetricID][config_][fold_id][switch_id]= benchmarksRun.accuracy;
                                }
        
                            }
                            
                            
                        }
                        saveAsJSON(benchmarks, "cache/" + benchmarkFileName);
                    }
                    
                }
            }
            
        }
    }
    saveAsJSON(benchmarks, benchmarkFileName);
}

export async function evaluate(riemann) {
    exec(riemann);
}