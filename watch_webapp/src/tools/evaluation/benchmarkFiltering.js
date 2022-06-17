import { Riemann } from "../riemann/riemann";


/**
 * 
 * @param {Timeseries_d} timeseries 
 * @param {*} nSteps 
 * @param {Riemann} riemann 
 */
export function runBenchmarkFiltering(nChannels, nBands, sampleRate, nSteps, riemann) {
    const timeseries = riemann.Timeseries(nChannels, nBands, sampleRate, nSteps * 1.2);

    var runtimes = [];



    for (var t = 0; t < nSteps; t++) {
        const channelData = [];
        for (var channelIdx = 0; channelIdx < nChannels; channelIdx++) { channelData.push(Math.random()); }
        var now = Date.now();
        timeseries.addTimestep(channelData);
        runtimes.push(Date.now() - now);
    }
    timeseries.clear();

    var finalRunTime = 0;
    for (const runtime of runtimes) 
    {  
        finalRunTime += runtime;
    }
    console.log(runtimes);
    finalRunTime = finalRunTime / runtimes.length;
    return [finalRunTime, runtimes];


}