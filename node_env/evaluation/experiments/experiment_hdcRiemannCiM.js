import { HdcRiemannCiM } from "../../tools/hdc/hdcRiemannCiM";
import { HdcCiMnGram } from "../../tools/hdc/hdcCiMnGram";
import { HdcHersche, Encodings } from "../../tools/hdc/hdchersche";
import { collectIV2a } from "../data_utils/readIV2a";
import { Riemann } from "../../tools/riemann/riemann";
import { maxIdx, arange } from "../data_utils/array_utils";
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm

 /**
 * 
 * @param {Riemann} riemann 
 */
export async function evaluate(riemann) {
    // --------- CONFIG ---------
    const subjects = arange(4, 10)
    const frequency = 250;
    const trialLengthSecs = 3.5;
    const breakLengthSecs = 2.5;
    const nChannels = 4;
    const nBands = 43;
    const hdDim = 10000;

    const nRuns = 10;
    const timeseries = riemann.Timeseries(nChannels, nBands, frequency, trialLengthSecs * frequency);
    // -------------------------

    const dataAll = {};

    for (var run = 0; run < nRuns; run++) {
        for (const subject of subjects) {
            console.log("TEST RUN " + run);
            console.log("SUBJECT " + subject);
            const hdc = new HdcRiemannCiM(nBands, nChannels, hdDim, riemann);
            // const hdc = new HdcCiMnGram(nBands, nChannels, hdDim, riemann);

            if (!dataAll[subject]) 
            { 
                dataAll[subject] = collectIV2a([subject], timeseries, trialLengthSecs * frequency, breakLengthSecs * frequency, riemann)[subject];
            }
            const data = dataAll[subject];

            for (var trialIdx = 0; trialIdx < data.train_data.length; trialIdx++) { hdc.addTrial(data.train_data[trialIdx].trial, data.train_labels[trialIdx] - 1); }
            const trainingAcc = await hdc.fit(true);

            var nCorrects = 0;
            for (const trialIdx of tqdm(arange(0, data.benchmark_data.length), {logging: true} )) 
            {
                const trialTensor = data.benchmark_data[trialIdx];
                const probs = await hdc.predict(trialTensor.trial);
                const pred = maxIdx(probs)
                nCorrects += pred == (data.benchmark_labels[trialIdx] - 1);
            }
            const acc = nCorrects / data.benchmark_data.length; // data.benchmark_data.length
            console.log("cross sesh acc: " + acc + ", training set acc: " + trainingAcc);
        }
    }    
}