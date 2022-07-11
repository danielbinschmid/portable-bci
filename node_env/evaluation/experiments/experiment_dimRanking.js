import { SETTINGS } from "../../tools/hdc/hdcCiMBase";
import { HdcCiMBsc } from "../../tools/hdc/hdcCiMBsc";
import { HdcCiMHrr } from "../../tools/hdc/hdcCiMHrr";
import { HdcHersche, Encodings } from "../../tools/hdc/hdchersche";
import { collectIV2a, loadCached } from "../data_utils/readIV2a";
import { Riemann } from "../../tools/riemann/riemann";
import { maxIdx, arange, flatten3, maxIndeces, minIndeces } from "../data_utils/array_utils";
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm
import { saveAsJSON } from "../data_utils/save_benchmarks";
import { DimensionRankingHrr } from "../../tools/hdc/dimensionRankingHrr";

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
    const subjects = arange(3, 4)
    const frequency = 250;
    const trialLengthSecs = 3.5;
    const breakLengthSecs = 2.5;
    const cached = true;

    const basicSettings = {
            nBands: 43,
            nChannels: 4,
            hdDim: 10000,
            classLabels: [0, 1, 2],
            useTSpaceNGrams: false
    }

    const nRuns = 1;
    const timeseries = riemann.Timeseries(basicSettings.nChannels, basicSettings.nBands, frequency, trialLengthSecs * frequency);

    const experimentID = "dimRanking"
    // -------------------------

    var dataAll = {};
    if (cached) {dataAll = loadCached(riemann, subjects); }

    const accs = {};

    for (var run = 0; run < nRuns; run++) {
        const run_id = "run_" + run
        accs[run_id] = {};
        for (const subject of subjects) {
            const subj_id = "subj_" + subject
            accs[run_id][subj_id] = {};
            

            for (const isReversed of [false]) {
                const sessionID = "isReversed_" + isReversed;
                console.log("--------------------------------------------------------------------------")
                console.log("TEST RUN " + run + ", SUBJECT "+ subject + ", reversed sessions: " + isReversed);

                const hdc = new HdcCiMHrr(basicSettings, riemann);
                
                // const hdc = new HdcHersche(basicSettings.nBands, basicSettings.nChannels, basicSettings.classLabels, Encodings.THERMOMETER, { q: 2 * 393}, riemann);
                const data = get_data(dataAll[subject], isReversed);

                console.log("fitting hdc ..")
                for (var trialIdx = 0; trialIdx < data.train_data.length; trialIdx++) { hdc.collectTrial(data.train_data[trialIdx].trial, data.train_labels[trialIdx] - 1); }
                const labels = [...hdc._trialLabels]
                const trainingBatch = await hdc.fitEmitBatch();
                const dimRanking = new DimensionRankingHrr(hdc);
                var rankingVec = dimRanking.genRankingVec(hdc._AM, trainingBatch, labels);
                rankingVec = rankingVec.arraySync();

                const nReducedDim = 50
                const randomDims = arange(0, nReducedDim)
                const importantDims = maxIndeces(rankingVec, nReducedDim); //
                const badDims = minIndeces(rankingVec, nReducedDim);

                const logs = false;
                if (logs) {
                    for (const i of importantDims) {
                        console.log(rankingVec[i]);
                    }
                    console.log("/////")
                    for (const i of badDims) {
                        console.log(rankingVec[i]);
                    }
                    console.log("/////")
                }
                const accRandomReduced = hdc._predictBatch(trainingBatch.gather(randomDims, 1), labels, hdc._AM.gather(randomDims, 1));
                const accReduced = hdc._predictBatch(trainingBatch.gather(importantDims, 1), labels, hdc._AM.gather(importantDims, 1));
                const accBad = hdc._predictBatch(trainingBatch.gather(badDims, 1), labels, hdc._AM.gather(badDims, 1));
                const accRef = hdc._predictBatch(trainingBatch, labels, hdc._AM);

                console.log(accBad);
                console.log(accRandomReduced);
                console.log(accReduced)
                console.log(accRef);
 
            }
            // saveAsJSON(accs, "cache/" + experimentID);
        }
    }    
    // saveAsJSON(accs, experimentID);
}