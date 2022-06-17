import { Riemann } from '../../tools/riemann/riemann';
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm
import { arange } from './array_utils';
import { Data } from '../run_eval';
const fs = require('fs');
const IV2aDataFolter = './evaluation/data/IV2a/';
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
            for (const channel of trial) { channelData.push(channel[t + tShift]); }
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