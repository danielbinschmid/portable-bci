/**
 * Cross subject and Riemann cross session combined
 */

import { SETTINGS } from "../../tools/hdc/hdcCiMBase";
import { HdcCiMBsc } from "../../tools/hdc/hdcCiMBsc";
import { HdcCiMHrr } from "../../tools/hdc/hdcCiMHrr";
import { HdcHersche, Encodings } from "../../tools/hdc/hdchersche";
import { collectIV2a, loadCached } from "../data_utils/readIV2a";
import { Riemann } from "../../tools/riemann/riemann";
import { maxIdx, arange, flatten3, maxIndeces, minIndeces, isBelowPercentileVector } from "../data_utils/array_utils";
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm
import { saveAsJSON } from "../data_utils/save_benchmarks";
import { DimensionRankingHrr, AMsData } from "../../tools/hdc/dimensionRankingHrr";
import * as tf from "@tensorflow/tfjs-node-gpu"

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

var SubjectProcessed = {
    /** @type {tf.Tensor2D} */
    trainingSet: null,
    /** @type {Number[]} */
    trainingLabels: null,
    /** @type {tf.Tensor2D} */
    testSet: null,
    /** @type {Number[]} */
    testLabels: null,
    /** @type {tf.Tensor2D} */
    AM: null,
    /** @type {tf.Tensor1D} */
    importanceVec: null
}

/**
 * 
 * @param {boolean} isReversed 
 * @param {*} dataAll 
 * @param {HdcCiMHrr} hdc 
 * @param {Number[]} subjects 
 * @param {Riemann} riemann 
 * @returns {SubjectProcessed[]}
 */
async function processSubjects(isReversed, dataAll, hdc, subjects, riemann) {
    const subjectsProcessed = {}
    for (const subject of subjects) {
        subjectsProcessed[subject] = {}

        const data = get_data(dataAll[subject], isReversed);
        hdc._riemannKernel = riemann.RiemannKernel();
        hdc._riemannKernel.setMeanMetric(riemann.EMetric.Euclidian);
        for (var trialIdx = 0; trialIdx < data.train_data.length; trialIdx++) { hdc.collectTrial(data.train_data[trialIdx].trial, data.train_labels[trialIdx] - 1); }
        const labels = [...hdc._trialLabels]
        const trainingBatch = await hdc.fitEmitBatch();

        const testLabels = []
        const testSet = []
        for (var trialIdx = 0; trialIdx < data.benchmark_data.length; trialIdx++) { 
            const buf = riemann.ArrayBuffer()
            hdc._riemannKernel.apply(data.benchmark_data[trialIdx].trial, buf);
            const trial = hdc._encodeBatch(buf, 1).reshape([hdc._hdDim]);
            testSet.push(trial);
            testLabels.push(data.benchmark_labels[trialIdx] - 1);
            hdc._riemannKernel.updateMean(data.benchmark_data[trialIdx].trial, 4);
        }

        subjectsProcessed[subject]["trainingSet"]    = trainingBatch
        subjectsProcessed[subject]["trainingLabels"] = labels
        subjectsProcessed[subject]["testSet"]        = tf.stack(testSet)
        tf.dispose(testSet);
        subjectsProcessed[subject]["testLabels"]     = testLabels
        subjectsProcessed[subject]["AM"]             = tf.stack(hdc._AM.unstack())
    }
    return subjectsProcessed
}

var Accs = {
    trainingAccBefore: 0,
    trainingAccAfter: 0,
    testAccBefore: 0,
    testAccAfter: 0,
    finetunedTrainingAcc: 0,
    finetunedTestingAcc: 0
}
/**
 * 
 * @param {SubjectProcessed[]} subjectsProcessed 
 * @param {HdcCiMHrr} hdc 
 * @param {tf.Tensor2D} fusedAM 
 * @param {tf.Tensor2D} finetunedAM
 */
function runTest(subjectsProcessed, hdc, fusedAM, finetunedAM, subject) {
    /** @type {Accs} */
    const accs = {}

    accs.trainingAccBefore = hdc._predictBatch(
        subjectsProcessed[subject].trainingSet, 
        subjectsProcessed[subject].trainingLabels,
        subjectsProcessed[subject].AM
    );

    accs.trainingAccAfter = hdc._predictBatch(
        subjectsProcessed[subject].trainingSet, 
        subjectsProcessed[subject].trainingLabels,
        fusedAM
    );

    accs.finetunedTrainingAcc = hdc._predictBatch(
        subjectsProcessed[subject].trainingSet, 
        subjectsProcessed[subject].trainingLabels,
        finetunedAM
    );

    accs.testAccBefore = hdc._predictBatch(
        subjectsProcessed[subject].testSet, 
        subjectsProcessed[subject].testLabels,
        subjectsProcessed[subject].AM
    );

    accs.testAccAfter = hdc._predictBatch(
        subjectsProcessed[subject].testSet, 
        subjectsProcessed[subject].testLabels,
        fusedAM
    );

    accs.finetunedTestingAcc = hdc._predictBatch(
        subjectsProcessed[subject].testSet, 
        subjectsProcessed[subject].testLabels,
        finetunedAM
    );

    return accs;
}

var FusionPack = {
    /** @type {AMsData} */
    centerAMData: null,
    /** @type {AMsData} */
    extraAMsData: null
}

/**
 * 
 * @param {SubjectProcessed[]} subjectsProcessed 
 * @param {Number} subject
 * @returns {FusionPack}
 */
function prepareFusion(subjectsProcessed, subject, subjects, dimRanking) {
    const relevantTrainingSet = subjectsProcessed[subject].trainingSet
    const relevantTrainingLabels = subjectsProcessed[subject].trainingLabels

    /** @type {FusionPack} */
    const fusionPack = {
        centerAMData: undefined,
        extraAMsData: { AMs: [], importanceVecs: []}
    }

    for (const subj of subjects) {
        const rankingVec = dimRanking.genRankingVec(subjectsProcessed[subj].AM, relevantTrainingSet, relevantTrainingLabels);
        subjectsProcessed[subj]["importanceVec"] = rankingVec;
        if (subj != subject) {
            fusionPack.extraAMsData.AMs.push(subjectsProcessed[subj].AM);
            fusionPack.extraAMsData.importanceVecs.push(subjectsProcessed[subj].importanceVec);
        }        
    }

    fusionPack.centerAMData = {
        AMs: [subjectsProcessed[subject].AM],
        importanceVecs: [subjectsProcessed[subject].importanceVec]
    }

    return fusionPack;
}

 /**
 * 
 * @param {Riemann} riemann 
 */
export async function evaluate(riemann) {
    // --------- CONFIG ---------
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]// [1, 3, 8, 9]
    const percentiles = [0.5] // [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]
    const percentage_training = [1, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]
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
    const experimentID = "crossSubjectAndCrossSession"
    // -------------------------

    var dataAll = loadCached(riemann, subjects);
    const accsJson = {}
    for (var run = 0; run < nRuns; run++) {
        const run_id = "run_" + run
        accsJson[run_id] = {}
        for (const isReversed of [false, true]) {
            const sessionID = "isReversed_" + isReversed;
            accsJson[run_id][sessionID] = {}
            const hdc = new HdcCiMHrr(basicSettings, riemann);
            const dimRanking = new DimensionRankingHrr(hdc);

            // compute AMs
            const subjectsProcessed = await processSubjects(isReversed, dataAll, hdc, subjects, riemann);

            // fusion
            for (const subject of subjects) {
                const subj_id = "subj_" + subject;
                accsJson[run_id][sessionID][subj_id] = {}
                const fusionPack = prepareFusion(subjectsProcessed, subject, subjects, dimRanking);

                for (const percentile of percentiles) {
                    const percentile_id = "percentile_" + percentile;
                    accsJson[run_id][sessionID][subj_id][percentile_id] = {}
                    console.log("<<<<<<<")
                    console.log("   subject: " + subject)
                    console.log("   percentile: " + percentile)

                    const fusedAM = await dimRanking.fuseAMsCenter(fusionPack.extraAMsData, fusionPack.centerAMData, percentile);
                    const finetunedAM = hdc._retrainAM(subjectsProcessed[subject].trainingSet, subjectsProcessed[subject].trainingLabels, fusedAM, 0.05, 10)
                    const accs = runTest(subjectsProcessed, hdc, fusedAM, finetunedAM, subject);
                    
                    console.log("   trainingAccBefore: "    + accs.trainingAccBefore);
                    console.log("   trainingAccAfter: "     + accs.trainingAccAfter);
                    console.log("   testAccBefore: "        + accs.testAccBefore);
                    console.log("   testAccAfter: "         + accs.testAccAfter);
                    console.log("   finetunedTestingAcc: "  + accs.finetunedTestingAcc);
                    console.log("   finetunedTrainingAcc: " + accs.finetunedTrainingAcc);

                    accsJson[run_id][sessionID][subj_id][percentile_id]["trainingAccBefore"]     = accs.trainingAccBefore;
                    accsJson[run_id][sessionID][subj_id][percentile_id]["trainingAccAfter"]      = accs.trainingAccAfter;
                    accsJson[run_id][sessionID][subj_id][percentile_id]["testAccBefore"]         = accs.testAccBefore;
                    accsJson[run_id][sessionID][subj_id][percentile_id]["testAccAfter"]          = accs.testAccAfter;
                    accsJson[run_id][sessionID][subj_id][percentile_id]["finetunedTestingAcc"]   = accs.finetunedTestingAcc;
                    accsJson[run_id][sessionID][subj_id][percentile_id]["finetunedTrainingAcc"]  = accs.finetunedTrainingAcc;
                    console.log(">>>>>>>")
                }   
                saveAsJSON(accsJson, "cache/" + experimentID);
            }
        }
    }    
    saveAsJSON(accsJson, experimentID);
}