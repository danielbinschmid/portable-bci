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
 * @param {Timeseries_d} timeseries 
 * @param {number} nSteps 
 * @param {number} tShift 
 * @param {Riemann} riemann
 * @returns 
 */
export function gen(timeseries, nSteps, tShift, riemann) {
    const data = []

    for (const trialIdx of tqdm(arange(0, benchmark_data.length), { logging: true })) { // benchmark_data.length

        // add break
        for (var t = 0; t < tShift; t++) {
            const channelData = [];
            for (var channelIdx = 0; channelIdx < 4; channelIdx++) { channelData.push(Math.random()); }
            timeseries.addTimestep(channelData);
        }

        let breakTensor = riemann.Timetensor();
        timeseries.popAll(breakTensor);

        // get trial
        for (var t = 0; t < nSteps; t++) {
            const channelData = [];
            for (var channelIdx = 0; channelIdx < 4; channelIdx++) { channelData.push(Math.random()); }
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

