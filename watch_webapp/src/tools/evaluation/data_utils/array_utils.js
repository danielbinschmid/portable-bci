/**
 * 
 * @param {number} start 
 * @param {number} end 
 * @returns {number[]}
 */
export function arange(start, end) {
    const arr = []
    for (var i = start; i < end; i++) { arr.push(i); }
    return arr;
}

/**
 * Index of maximum value in array
 * @param {number[]} arr 
 * @returns {number}
 */
export function maxIdx(arr) {
    var curMax = 0;
    var curIdx = null;
    for (var idx = 0; idx < arr.length; idx++) {
        if (arr[idx] > curMax) {
            curMax = arr[idx];
            curIdx = idx;
        }
    }
    return curIdx;
}


export function flatten3(data) {
    var flattened = [];

    for (let d of data) {
        for (let d2 of d) {
            for (let d3 of d2) {
                flattened = flattened.concat(d3);
                
            }
        }
    }
    console.log(flattened.length);
    return flattened
}

export function flatten2(data) {
    var flattened = [];

    for (let d of data) {
        for (let d2 of d) {
            flattened = flattened.concat(d2);
        }
    }
    return flattened
}


