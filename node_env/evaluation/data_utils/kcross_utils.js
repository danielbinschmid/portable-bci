/**
 * Array utils for k-fold-cross validation.
 */

import { arange } from "./array_utils";
import { Data } from "../experiments/riemannMean/run_eval";

const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

/**
 * validates correctness of fold
 * @param {number[]} train_indeces 
 * @param {number[]} test_indeces 
 * @param {number[]} all_indeces 
 */
function validateFold(train_indeces, test_indeces, all_indeces) {
    for (const idx of all_indeces) {
        if (train_indeces.findIndex((val, ind, arr) => {return val == idx}) == -1 && test_indeces.findIndex((val, ind, arr) => {return val == idx}) == -1) {
            throw "not present index in test and training split: " + idx.toString();
        }
        if (train_indeces.findIndex((val, ind, arr) => {return val == idx}) >= 0 && test_indeces.find((val, ind, arr) => {return val == idx}) >= 0) {
            throw "double present index";
        }
    }
}

/**
 * 
 * @param {number[][]} test_folds 
 * @param {number[]} all_indeces 
 */
function validateTestSplits(test_folds, all_indeces) {
    for (const idx of all_indeces) {
        var count = 0;
        for (const test_fold of test_folds) {
            if (test_fold.findIndex((val, ind, arr) => {return val == idx}) >= 0) {
                count += 1;
            }
        }

        if (count != 1) {
            throw "either index not present or double in test_folds";
        }
    }
}



/**
 * 
 * @param {Data} data 
 * @param {number} k
 * @returns {Data[]} 
 */
export function computeSplit(data, k) {
    const nTrials = data.train_labels.length;
    if (nTrials != data.train_data.length) { throw "labels not same length as data"; }
    let indeces = arange(0, nTrials);
    shuffleArray(indeces);
    const foldNTrials = Math.floor(nTrials / k);

    const dataForEachK = [];
    const testFoldsIndeces = []

    for (var kFold = 0; kFold < k; kFold++) {

        const test_data = [];
        const train_data = [];
        const test_labels = [];
        const train_labels = [];
        const train_indeces = [];
        const test_indeces = [];

        for (const trialIdx of indeces) {

            if (trialIdx >= kFold * foldNTrials && trialIdx < (kFold + 1) * foldNTrials) {
                test_data.push(data.train_data[trialIdx]);
                test_labels.push(data.train_labels[trialIdx]);
                test_indeces.push(trialIdx);

            } else if (trialIdx >= k * foldNTrials) {
                if (k * foldNTrials + kFold == trialIdx && k * foldNTrials + kFold < nTrials) {
                    test_data.push(data.train_data[trialIdx]);
                    test_labels.push(data.train_labels[trialIdx]);
                    test_indeces.push(trialIdx);
                } else {
                    train_data.push(data.train_data[trialIdx]);
                    train_labels.push(data.train_labels[trialIdx]);
                    train_indeces.push(trialIdx);
                }
            } else {
                train_data.push(data.train_data[trialIdx]);
                train_labels.push(data.train_labels[trialIdx]);
                train_indeces.push(trialIdx);
            }
            
        }

        validateFold(train_indeces, test_indeces, indeces);
        testFoldsIndeces.push(test_indeces);

        const kData = {
            train_data  : train_data,  
            train_labels: train_labels,
            benchmark_data      : test_data,      
            benchmark_labels    : test_labels    
        };

        dataForEachK.push(kData)
    }

    validateTestSplits(testFoldsIndeces, indeces);

    return dataForEachK;
}