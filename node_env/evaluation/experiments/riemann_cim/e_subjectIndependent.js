import { SETTINGS } from "../../../tools/hdc/hdcCiMBase";
import { HdcCiMBsc } from "../../../tools/hdc/hdcCiMBsc";
import { HdcCiMHrr } from "../../../tools/hdc/hdcCiMHrr";
import { HdcHersche, Encodings } from "../../../tools/hdc/hdchersche";
import { collectIV2a, loadCached } from "../../data_utils/readIV2a";
import { Riemann } from "../../../tools/riemann/riemann";
import { maxIdx, arange, flatten3, maxIndeces, minIndeces, isBelowPercentileVector } from "../../data_utils/array_utils";
import tqdm from "ntqdm"; // https://github.com/jhedin/ntqdm
import { saveAsJSON } from "../../data_utils/save_benchmarks";
import { DimensionRankingHrr, AMsData } from "../../../tools/hdc/dimensionRankingHrr";
import { DimensionRankingfHrr } from "../../../tools/hdc/DimensionRankingfHrr";
import { HdcCiMfHrr } from "../../../tools/hdc/hdcCiMfHrr";
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
        const dataJson = require("../../scripts/dataset/subj_"+ subject + ".json")["session_" + isReversed]
        
        const trainArr = []
        var i = 0;
        for (const trial of dataJson["trainArray"]) {
            trainArr.push(...trial)
            i+= 1;
        }
        const trainTypedArray = new Float64Array(trainArr)
        const train_data = hdc._encodeArray(trainTypedArray, i)
        const train_labels = dataJson["trainLabels"]

        const testArr = []
        var j = 0;
        for (const trial of dataJson["benchmarkArray"]) {
            testArr.push(...trial)
            j+= 1;
        }
        const test_data = hdc._encodeArray(testArr, j);
        const test_labels = dataJson["benchmarkLabels"]

        subjectsProcessed[subject]["trainingSet"]    = train_data
        subjectsProcessed[subject]["trainingLabels"] = train_labels
        subjectsProcessed[subject]["testSet"]        = test_data
        subjectsProcessed[subject]["testLabels"]     = test_labels
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
    const percentiles = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]
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
            const hdc = new HdcCiMfHrr(basicSettings, riemann);
            const dimRanking = new DimensionRankingfHrr(hdc);
            // compute AMs
            console.log("riemann preprocessing")
            const subjectsProcessed = await processSubjects(isReversed, dataAll, hdc, subjects, riemann);

            // train
            const X = []
            const Y = []
           
            // fusion
            var avg = 0
            for (const subject of subjects) {
                //const X = []
                //const Y = []
           
                //for (const subj of subjects) {
                //    if (subj != subject) {
                //        X.push(...subjectsProcessed[subj].trainingSet.unstack())
                //        Y.push(...subjectsProcessed[subj].trainingLabels);
                //    }
               // }
                //console.log("fitting")
                //const crossSubjectAM = hdc._genAM(tf.stack(X), Y, 1, true, 10, 0.05)
                //tf.dispose(X);

                const am = hdc._genAM(subjectsProcessed[subject].trainingSet, subjectsProcessed[subject].trainingLabels, 1, false, 20, 0.1)
                //const ranking1 = dimRanking.genRankingVec(crossSubjectAM, subjectsProcessed[subject].trainingSet, subjectsProcessed[subject].trainingLabels)
                //const ranking2 = dimRanking.genRankingVec(am, subjectsProcessed[subject].trainingSet, subjectsProcessed[subject].trainingLabels)
                //const amfused = await dimRanking.fuseAMs({
                //    AMs: [crossSubjectAM, am],
                //    importanceVecs: [ranking1, ranking2]
                //})
                // const am2 = hdc._retrainAM(subjectsProcessed[subject].trainingSet, subjectsProcessed[subject].trainingLabels, amfused, 0.05, 5)
                const trainAcc = hdc._predictBatch(subjectsProcessed[subject].trainingSet, subjectsProcessed[subject].trainingLabels, am);
                const acc = hdc._predictBatch(subjectsProcessed[subject].testSet, subjectsProcessed[subject].testLabels, am);
                console.log(acc)
                console.log(trainAcc)
                avg += acc / subjects.length
            }
            console.log("avg: " + avg);
        }
    }    
    //saveAsJSON(accsJson, experimentID);
}

export default evaluate;