const bci = require('bcijs');

/**
 * 
 * @param {number} base 
 * @param {number} number 
 * @returns 
 */
function log(base, number) {
    return Math.log(number) / Math.log(base);
}

/**
 * Implementation guidelined 
 * from https://web.archive.org/web/20181105231756/http://developer.choosemuse.com/tools/available-data#Absolute_Band_Powers
 * Other implementation use numerical approximation of integrals, the muse library, in contrast, computed the logarithm of the sum of 
 * the affiliated frequency bands.
 * 
 * @param {*} psds 
 * @param {number[]} f 
 */
function periodogramToBandsMuse(psds, f) {
    const bands = [0, 0, 0, 0, 0];
    for (var i = 0; i < f.length; i++) {
        if (f[i] >= 1 && f[i] <= 4) {
            // delta
            bands[0] += psds[i];
        }
        if (f[i] >= 4 && f[i] <= 8) {
            // theta
            bands[1] += psds[i];
        }
        if (f[i] > 8 && f[i] <= 12) {
            // alpha
            bands[2] += psds[i];
        }
        if (f[i] > 12 && f[i] <= 30) {
            // beta
            bands[3] += psds[i];
        }
        if (f[i] > 30 && f[i] <= 43) {
            // gamma
            bands[4] += psds[i];
        }
    }
    return bands.map(x => log(10, x));
}

/**
 * 
 * @param {number[]} data 
 * @param {number} sample_rate 
 */
export function toFrequencyBands(data, sample_rate) {
    // data comes in shape (timesteps)
    // for the timesteps it is assumed, that timesteps / frequency = window size
    // returns (frequencyBands) 
    const periodogram = bci.periodogram(data, sample_rate);
    const bands = periodogramToBandsMuse(periodogram['estimates'], periodogram['frequencies']);
    return bands;
}


export function debugBciJs() {
    // Training set
    let class1 = [[0, 0], [1, 2], [2, 2], [1.5, 0.5]];
    let class2 = [[8, 8], [9, 10], [7, 8], [9, 9]];

    // Testing set
    let unknownPoints = [
        [-1, 0],
        [1.5, 2],
        [3, 3],
        [5, 5],
        [7, 9],
        [10, 12]
    ];

    // Learn an LDA classifier
    let ldaParams = bci.ldaLearn(class1, class2);

    // Test classifier
    let predictions = bci.ldaClassify(ldaParams, unknownPoints);

    console.log(predictions); // [ 0, 0, 0, 1, 1, 1 ]
}
