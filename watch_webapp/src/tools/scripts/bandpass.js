var Fili = require('fili');

var validNSpectra = [2, 8, 16, 25, 43]

export function initCoeffs(nSpectra) {
    if (validNSpectra.find((val, ind, obj) => {
        return val == nSpectra;
    }) == undefined) {
        return "invalid number of frequency spectra";
    }
    const resultData = [];
    var low = 0;
    var high = 10;
    for (var spectrum = 0; spectrum < nSpectra; spectrum++) {
        if (spectrum < 2) {
            low = 4 - 4 * spectrum;
            high = 36 - 4 * spectrum;
        }else if (spectrum < 8) {
            const i = spectrum - 2;
            low = 24 - 4 * i;
            high = 40 - 4 * i;
        }else if (spectrum < 16) {
            const i = spectrum - 8;
            low = 32 - 4 * i;
            high = 40 - 4 * i
        } else if (spectrum < 25) {
            const i = spectrum - 16;
            low = 4 + i * 4;
            high = 8 + i * 4;
        } else {
            const i = spectrum - 25;
            low = 4 + 2 * i;
            high = 6 + 2* i; 
        }
        
        resultData.push({low: low, high: high});
    }
    return resultData;
}


/**
 * 
 * @param {number[][]} data - of shape (nChannels, nTimesteps)
 * @param {number} frequency - the sampling frequency of the data
 * @param {number} lowCut
 * @param {number} highCut
 * @returns {number[][]} - of shape (nChannels, nTimesteps)
 */
export function prefilterMulitspectralHersche(data, frequency, lowCut, highCut) {
    // const bandwidths = [2, 4, 8, 16, 32]
    let filterOrder = 2;
    let firCalculator = new Fili.FirCoeffs();

    let coeffs = firCalculator.bandpass({order: filterOrder, characterstics: 'butterworth', Fs: frequency, F1: lowCut, F2: highCut});
    let filter = new Fili.FirFilter(coeffs);
    // 32 -> 2, 16 -> 6, 8 -> 8, 4 -> 9, 2 -> 18 
    // 16 -> 6
    // 
    // const spectralData = []
    //for (let channel of data) {
    //    const filtered = filter.simulate(channel);
    //    spectralData.push(filtered);
    //}
    const filtered = filter.simulate(data);
    return filtered;

}