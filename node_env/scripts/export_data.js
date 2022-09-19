/**
 * Script to store/export preprocessed data.
 */

import { loadCached } from "../evaluation/data_utils/readIV2a";
import { arange } from "../evaluation/data_utils/array_utils";
import { saveAsJSON } from "../evaluation/data_utils/save_benchmarks";
import { Riemann } from "../../../tools/riemann/riemann";

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
export function export_data(riemann) {
    const subjects = arange(1, 10)
    const sessions = [false, true]
    const allData = loadCached(riemann, subjects);
    const loc = "./scripts/dataset/"

    for (const subject of subjects) {
        const processedDataJson = {}
        for (const session of sessions) {
            const sessionID = "session_" + session;
            processedDataJson[sessionID] = {}

            const riemannKernel = riemann.RiemannKernel()
            riemannKernel.setMeanMetric(riemann.EMetric.Euclidian);
            const data = get_data(allData[subject], session)
            const train_labels = []
            for (const trialIdx of arange(0, data.train_data.length)) 
            { 
                riemannKernel.addTrial(data.train_data[trialIdx].trial); 
                train_labels.push(data.train_labels[trialIdx] - 1);
            }

            const buff = riemann.ArrayBuffer()
            riemannKernel.fitTrials(buff);
            const trainArray = []
            for (const trialIdx of arange(0, data.train_data.length)) 
            {
                const buff = riemann.ArrayBuffer()
                riemannKernel.apply(data.train_data[trialIdx].trial, buff)
                const trainBatch = riemann.ArrayBufferToTypedArray(buff);
                trainArray.push(Array.from(trainBatch));
            }
            

            processedDataJson[sessionID]["trainArray"] = trainArray;
            processedDataJson[sessionID]["trainLabels"] = train_labels;

            const benchmarkBatch = []
            const benchmarkLabels = []
            for (const trialIdx of arange(0, data.benchmark_data.length)) {
                const buffB = riemann.ArrayBuffer()
                riemannKernel.apply(data.benchmark_data[trialIdx].trial, buffB);
                const benchmarkTrial = riemann.ArrayBufferToTypedArray(buffB)
                riemannKernel.updateMean(data.benchmark_data[trialIdx].trial, 4);

                const trialArray = Array.from(benchmarkTrial);
                benchmarkBatch.push(trialArray);
                benchmarkLabels.push(data.benchmark_labels[trialIdx] - 1);
            } 

            processedDataJson[sessionID]["benchmarkArray"] = benchmarkBatch;
            processedDataJson[sessionID]["benchmarkLabels"] = benchmarkLabels;
        }
        saveAsJSON(processedDataJson, "subj_" + subject, loc);
    }
}
