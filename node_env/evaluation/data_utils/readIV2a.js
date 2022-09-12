import { Riemann } from '../../tools/riemann/riemann';
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm
import { arange } from './array_utils';
import { saveAsJSON } from './save_benchmarks';
import { Data } from '../experiments/riemann_mean/run_eval';
const fs = require('fs');
const IV2aDataFolter = './evaluation/data/IV2a/';
const cacheFolder = IV2aDataFolter + 'cached/';
const prefix = IV2aDataFolter + "subj_";
const suffix = "_all.json";

/**
 * 
 * @param {*} benchmark_data 
 * @param {Timeseries_d} timeseries 
 * @param {*} nSteps 
 * @param {*} tShift 
 * @param {Riemann} riemann
 * @returns 
 */
function get(benchmark_data, timeseries, nSteps, tShift, riemann) {
    const data = []

    const nChannels = 4;

    for (const trialIdx of tqdm(arange(0, benchmark_data.length), { logging: true })) { // benchmark_data.length

        const trial = benchmark_data[trialIdx];

        // add break
        for (var t = 0; t < tShift; t++) {
            const channelData = [];
            for (const channel of trial) { channelData.push(channel[t]); }
            timeseries.addTimestep(channelData);
        }

        let breakTensor = riemann.Timetensor();
        timeseries.popAll(breakTensor);

        // get trial
        for (var t = 0; t < nSteps; t++) {
            const channelData = [];
            var chIdx = 0;
            for (const channel of trial) { 
                if (chIdx < nChannels) {
                    channelData.push(channel[t + tShift]); 
                }
                
                chIdx ++;
            }
            timeseries.addTimestep(channelData);
        }
        let trialTensor = riemann.Timetensor();
        timeseries.popAll(trialTensor);

        data.push({
            break_: breakTensor,
            trial: trialTensor
        });
    }
    return data;
}

/**
 * 
 * @param {number[]} subjects 
 * @param {Timeseries_d} timeseries 
 * @param {number} nSteps 
 * @param {number} tShift 
 * @param {Riemann} riemann 
 * @returns {Data[]}
 */
export function collectIV2a(subjects, timeseries, nSteps, tShift, riemann) {

    const dataAll = {};
    for (const subject of subjects) {
        
        const d = readIV2a(subject);

        const train_data = get(d.train_data, timeseries, nSteps, tShift, riemann);
        const test_data = get(d.test_data, timeseries, nSteps, tShift, riemann);

        

        const subjectData = {
            train_data: train_data,
            train_labels: d.train_labels,
            benchmark_data: test_data,
            benchmark_labels: d.test_labels
        }

        dataAll[subject] = subjectData;
    }
    return dataAll;
}

/**
 * 
 * @param {number} subjedIdx 
 * @returns 
 */
export function readIV2a(subjedIdx) {
    let rawdata = fs.readFileSync(prefix + subjedIdx.toString() + suffix);
    let d = JSON.parse(rawdata);
    return d;
}

var CacheType = {
    train_data: [0],

}

/**
 * 
 * @param {Riemann} riemann 
 */
export function cacheIV2a(riemann) {
    const subjects = arange(1, 10);
    const nChannels = 4;
    const nBands = 43;
    const sampleRate = 250;
    const expectedTSteps = 1000;
    const timeseries = riemann.Timeseries(nChannels, nBands, sampleRate, expectedTSteps);

    const trialLength = 3.5
    const breakLength = 2.5

    const dataAll = {}

    for (const subject of subjects) {
        dataAll[subject] = {}
        const data = collectIV2a([subject], timeseries, trialLength * sampleRate, breakLength * sampleRate, riemann)[subject];

        for (const sessionA of [false, true]) {
            var dataCollected = undefined;
            var dataLabels = undefined;
            var id = undefined;
            if (sessionA) {
                dataCollected = data.benchmark_data;
                dataLabels = data.benchmark_labels;
                id = "benchmark_data";
            } else {
                dataCollected = data.train_data;
                dataLabels = data.train_labels;
                id = "train_data"
            }

            const dataConverted = []; 

            for (const benchmarkTrialIdx of arange(0, dataCollected.length)) {
                const trialData = dataCollected[benchmarkTrialIdx];
                const trialBuf = riemann.ArrayBuffer();
                const breakBuf = riemann.ArrayBuffer();
                trialData.trial.getData(trialBuf);
                trialData.break_.getData(breakBuf);
                const trialArr = Array.from(riemann.ArrayBufferToTypedArray(trialBuf))
                const breakArr = Array.from(riemann.ArrayBufferToTypedArray(breakBuf))

                const trialObj = {
                    isCov: trialData.trial.isCov,
                    length: trialData.trial.length,
                    nBands: trialData.trial.nBands,
                    nChannels: trialData.trial.nChannels,
                    data: trialArr
                }
                const breakObj = {
                    isCov: trialData.break_.isCov,
                    length: trialData.break_.length,
                    nBands: trialData.break_.nBands,
                    nChannels: trialData.break_.nChannels,
                    data: breakArr
                }
    
                dataConverted.push({
                    trial: trialObj,
                    break_: breakObj,
                    label: dataLabels[benchmarkTrialIdx]
                });
            }

            dataAll[subject][id] = dataConverted;
        }

        saveAsJSON(dataAll, "subj_" + subject, cacheFolder);
    }

    
}

/**
 * 
 * @param {Riemann} riemann 
 * @returns {Data[]}
 */
export function loadCached(riemann, subjects=[1,2,3,4,5,6,7,8,9]) {
    const nChannels = 4;
    const nBands = 43;
    const sampleRate = 250;
    const expectedTSteps = 1000;
    const timeseries = riemann.Timeseries(nChannels, nBands, sampleRate, expectedTSteps);
    const trialLength = 3.5
    const breakLength = 2.5
    const isCov = true;

    const dataAll = {}
    for (const subject of subjects) {
        const rawdata = fs.readFileSync(cacheFolder + "subj_" + subject + ".json");
        let subjectData = JSON.parse(rawdata)[subject];
        dataAll[subject] = {}
        for (const sessionA of [false, true]) {
            var d = undefined;
            var label = undefined;
            var id_session = undefined;
            if (sessionA) {
                d = subjectData.train_data;
                id_session = "train_"
            } else {
                d = subjectData.benchmark_data;
                id_session = "benchmark_";
            }
            const converted_trials = []
            const converted_labels = []
            for (const trial of d) {
                const label = trial.label;
                const converted_trial = {}
                converted_labels.push(label);

                for (const isBreak of [false, true]) {
                    var obj = undefined
                    var id_tensor = undefined;
                    if (isBreak) {
                        obj = trial.trial;
                        id_tensor = "trial";
                    } else {
                        obj = trial.break_;
                        id_tensor = "break_";
                    }

                    var isCov_trial = obj.isCov
                    var length_trial = obj.length
                    var nBands_trial = obj.nBands
                    var nChannels_trial= obj.nChannels
                    var data_trial = obj.data;

                    const timetensor = riemann.Timetensor();
                    timeseries.loadCachedTensor(data_trial, length_trial, isCov_trial, timetensor);
                    converted_trial[id_tensor] = timetensor;
                }
                converted_trials.push(converted_trial);
            }

            dataAll[subject][id_session + "data"] = converted_trials;
            dataAll[subject][id_session + "labels"] = converted_labels;

        }
    }
    return dataAll
    
}