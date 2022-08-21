import { arange } from "../evaluation/data_utils/array_utils"

export function slice2ndDim(begin, end, array) {
    const res = []
    for (const c of array) {
        res.push([])
    }
    for (const i of arange(begin, end)) {
        for (const cIdx of arange(0,array.length)) {
            res[cIdx].push(array[cIdx][i])
        }
    }

    return res;
}

export function resample2ndDim(nElementsTarget, timeseries) {

    const resTimeseries = []
    for (const c of timeseries) {
        resTimeseries.push([])
    }
    const stepSize = timeseries[0].length / nElementsTarget;
    var curT = 0;
    for (const t of arange(0, nElementsTarget)) {
        const idx = Math.floor(curT);
        for (const cIdx of arange(0,timeseries.length)) {
            resTimeseries[cIdx].push(timeseries[cIdx][t]);
        }
        curT += stepSize;
    }

    return resTimeseries;
    
}

/**
 * Index of maximum value in array
 * @param {number[]} arr 
 * @returns {number}
 */
 export function maxIdx(arr) {
    var curMax = -1000000;
    var curIdx = null;
    for (var idx = 0; idx < arr.length; idx++) {
        if (arr[idx] > curMax) {
            curMax = arr[idx];
            curIdx = idx;
        }
    }
    return curIdx;
}

/**
 * 
 * @param {number[][]} data 
 * @returns {number[]}
 */
 export function flatten2(data) {
    var flattened = [];

    for (let d of data) {
        for (let d2 of d) {
            flattened = flattened.concat(d2);
        }
    }
    return flattened
}
