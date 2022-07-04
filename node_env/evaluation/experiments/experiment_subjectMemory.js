import * as tf from '@tensorflow/tfjs-node-gpu';
import { SETTINGS } from "../../tools/hdc/hdcCiMBase";
import { HdcCiMBsc } from "../../tools/hdc/hdcCiMBsc";
import { HdcCiMHrr } from "../../tools/hdc/hdcCiMHrr";
import { SubjectMemoryHrr } from "../../tools/hdc/subject_memory/SubjectMemoryHrr";
import { HdcHersche, Encodings } from "../../tools/hdc/hdchersche";
import { collectIV2a, loadCached } from "../data_utils/readIV2a";
import { Riemann } from "../../tools/riemann/riemann";
import { maxIdx, arange, flatten3, shuffle, shuffle2 } from "../data_utils/array_utils";
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm
import { saveAsJSON } from "../data_utils/save_benchmarks";
import { TFHUB_SEARCH_PARAM } from "@tensorflow/tfjs-converter/dist/executor/graph_model";

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
    const allSubjects = arange(1, 10);
    const subjects = arange(1, 10);
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

    const nRuns = 10;
    const timeseries = riemann.Timeseries(basicSettings.nChannels, basicSettings.nBands, frequency, trialLengthSecs * frequency);

    const experimentID = "crossSubjectDataAugmentedRetraining"
    // -------------------------

    var dataAll = {};
    if (cached) {dataAll = loadCached(riemann, subjects); }

    const accs = {};
    for (var run = 0; run < nRuns; run++) {
        const run_id = "run_" + run
        accs[run_id] = {};
        for (const isReversed of [false]) {
            const sessionID = "isReversed_" + isReversed;
            accs[run_id][sessionID] = {}
            
            const hdc = new HdcCiMHrr(basicSettings, riemann);
            const subjMemory = new SubjectMemoryHrr(riemann, hdc);
            for (const subjRef of allSubjects) {
                const data = get_data(dataAll[subjRef], isReversed);
                subjMemory.genSubjectMemory(data.train_data, data.train_labels, ""+ subjRef);
            }
            for (const subject of subjects) {
                const subj_id = "subj_" + subject
                accs[run_id][sessionID][subj_id] = {};
                
                
                console.log("--------------------------------------------------------------------------")
                console.log("TEST RUN " + run + ", SUBJECT "+ subject + ", reversed sessions: " + isReversed);

                hdc.clear()

                // const hdc = new HdcHersche(basicSettings.nBands, basicSettings.nChannels, basicSettings.classLabels, Encodings.THERMOMETER, { q: 2 * 393}, riemann);
                const data = get_data(dataAll[subject], isReversed);
                const train_data = data.train_data;
                var train_labels = []
                for (const trialIdx of arange(0, train_data.length)) {
                    train_labels.push(data.train_labels[trialIdx] - 1);
                }

                const nTrialsAugmented = 5;
                const [augmentationTrials, augmentationLabels] = subjMemory.getTopTrials(nTrialsAugmented, [subject]);


                for (const trialIdx of arange(0, train_data.length)) { hdc._riemannKernel.addTrial(train_data[trialIdx].trial); }
                const buff = riemann.ArrayBuffer();
                hdc._riemannKernel.fitTrials(buff);
                const batches = tf.tidy(() => {
                    const batch = hdc._encodeBatch(buff, train_data.length);
                    const batchTrials = batch.unstack();
                    const concat = batchTrials.concat(augmentationTrials).concat(augmentationTrials);
                    return concat;
                });
                train_labels = train_labels.concat(augmentationLabels).concat(augmentationLabels);
                shuffle2(batches, train_labels);
                const train_batch = tf.stack(batches);

                hdc._AM = hdc._genAM(train_batch, train_labels, 1, true, 20, 0.2);

                var subjKNearest = 0
                var own = 0
                var subjectsKNearest = []
                for (const i of allSubjects) {
                    subjectsKNearest.push(0);
                }
                for (const trialIdx of arange(0, data.benchmark_data.length)) {
                    const buff = riemann.ArrayBuffer();
                    hdc._riemannKernel.apply(data.benchmark_data[trialIdx].trial, buff);
                    const trial = hdc._encodeBatch(buff, 1).reshape([hdc._hdDim]);

                    const predictions = subjMemory.query(trial, false);
                    const predictionsVerbose = subjMemory.query(trial, true);
                    var s = 0;
                    for (const subjPreds of predictionsVerbose) {
                        subjectsKNearest[s] += maxIdx(subjPreds) == data.benchmark_labels[trialIdx] - 1;
                        s++;
                    }
                    const ownPrediction = await hdc._predictBatch(trial.reshape([1, hdc._hdDim]), [data.benchmark_labels[trialIdx] - 1], hdc._AM);
                    subjKNearest += maxIdx(predictions) == data.benchmark_labels[trialIdx] - 1
                    own += ownPrediction;
                }
                accs[run_id][sessionID][subj_id]["subjMem"] = subjKNearest / data.benchmark_data.length;
                accs[run_id][sessionID][subj_id]["subjIndiv"] = own / data.benchmark_data.length;
                console.log("subject memory accuracy: " + subjKNearest / data.benchmark_data.length);
                console.log("subject individual AM accuracy: " + own / data.benchmark_data.length);
                for (const s of arange(0, allSubjects.length)) {
                    accs[run_id][sessionID][subj_id]["subj" + s] = subjectsKNearest[s] / data.benchmark_data.length;
                    console.log("accuracy for subject " + s + ": " + subjectsKNearest[s] / data.benchmark_data.length )
                }
                

                /**
                 * 
                 
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

                accs[run_id][subj_id][sessionID] = acc;
                */
                //saveAsJSON(accs, "cache/" + experimentID);
            }
        }
    }    
    // saveAsJSON(accs, experimentID);
}
