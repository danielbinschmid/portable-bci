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
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
export function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
 export function shuffle2(a, b) {
    var j, x, y, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        y = b[i]
        a[i] = a[j];
        b[i] = b[j];
        a[j] = x;
        b[j] = y;
    }
}
/**
 * 
 * @param {number} scalar 
 * @param {number} size 
 */
export function fill(scalar, size) {
    const arr = [];
    for (let i = 0; i < size; i++) {
        arr.push(scalar);
    }
    return arr;
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
 * @param {Number[]} arr 
 * @param {*} nMax 
 */
export function maxIndeces(arr, nMax) {
    if (nMax > arr.length) { throw ("nMax is bigger than length of array"); }

    arr = arr.map((val, ind, arr) => {return [ind, val]});
    arr = arr.sort(function(a, b){return a[1] - b[1]}).reverse();

    const maxEls = []
    for (const i of arange(0, nMax)) {
        maxEls.push(arr[i][0]);
    }
    return maxEls;
}


/**
 * 
 * @param {Number[]} arr 
 * @param {*} nMin 
 */
 export function minIndeces(arr, nMin) {
    if (nMin > arr.length) { throw ("nMax is bigger than length of array"); }

    arr = arr.map((val, ind, arr) => {return [ind, val]});
    arr = arr.sort(function(a, b){return a[1] - b[1]});

    const maxEls = []
    for (const i of arange(0, nMin)) {
        maxEls.push(arr[i][0]);
    }
    return maxEls;
}

/**
 * 
 * @param {Number[]} vector 
 * @param {Number} percentile 
 */
 export function isBelowPercentileVector(vector, percentile) {
    const nMin = Math.floor(percentile * vector.length);
    const minIndecesArr = minIndeces(vector, nMin);

    const result = []
    for (const i of arange(0, vector.length)) {
        result.push(minIndecesArr.findIndex((val, ind, arr) => {
            return val == i;
        }) != -1);
    }
    return result;
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


