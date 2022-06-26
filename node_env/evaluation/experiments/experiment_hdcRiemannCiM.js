import { HdcRiemannCiM, SETTINGS  } from "../../tools/hdc/hdcRiemannCiM";
import { HdcHersche, Encodings } from "../../tools/hdc/hdchersche";
import { collectIV2a } from "../data_utils/readIV2a";
import { Riemann } from "../../tools/riemann/riemann";
import { maxIdx, arange } from "../data_utils/array_utils";
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm

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
export async function evaluate(riemann) {
    // --------- CONFIG ---------
    const subjects = arange(1, 10)
    const frequency = 250;
    const trialLengthSecs = 3.5;
    const breakLengthSecs = 2.5;

    const basicSettings = {
            nBands: 43,
            nChannels: 4,
            hdDim: 10000,
            classLabels: [0, 1, 2],
            useTSpaceNGrams: false
    }

    const nRuns = 10;
    const timeseries = riemann.Timeseries(basicSettings.nChannels, basicSettings.nBands, frequency, trialLengthSecs * frequency);
    // -------------------------

    const dataAll = {};

    for (var run = 0; run < nRuns; run++) {
        for (const subject of subjects) {
            if (!dataAll[subject]) 
            { 
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
                console.log("loading data of subject " + subject + " ..")
                dataAll[subject] = collectIV2a([subject], timeseries, trialLengthSecs * frequency, breakLengthSecs * frequency, riemann)[subject];
                console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
            }
            for (const isReversed of [false, true]) {
                console.log("--------------------------------------------------------------------------")
                console.log("TEST RUN " + run + ", SUBJECT "+ subject + ", reversed sessions: " + isReversed);

                const hdc = new HdcRiemannCiM(basicSettings, riemann);
                const data = get_data(dataAll[subject], isReversed);

                console.log("fitting hdc ..")
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
                console.log("--------------------------------------------------------------------------")
            }
            
        }
    }    
}