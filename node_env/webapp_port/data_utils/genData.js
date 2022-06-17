import { Riemann } from '../../tools/riemann/riemann';
import { arange } from './array_utils';
import { Data } from '../run_eval';

/**
 * 
 * @param {number} nTrials
 * @param {Timeseries_d} timeseries 
 * @param {number} nSteps 
 * @param {number} tShift 
 * @param {Riemann} riemann
 * @returns 
 */
export function genTrials(nTrials, timeseries, nSteps, tShift, riemann) {
    const data = []

    for (const trialIdx of arange(0, nTrials)) { // benchmark_data.length

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
    const labels = []
    for (const trialIdx of arange(0, nTrials)) { // benchmark_data.length
        const i = Math.floor(1 + Math.random() * 3);
        labels.push(i);
    }
    return {
        train_data: data,
        train_labels: labels,
        benchmark_data: data,
        benchmark_labels: labels
    };
}

