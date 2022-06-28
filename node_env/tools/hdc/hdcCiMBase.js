import * as tf from '@tensorflow/tfjs-node-gpu';
// import '@tensorflow/tfjs-backend-wasm';
// import { randomUniformVariable } from '@tensorflow/tfjs-layers/dist/variables';

import { Riemann } from "../riemann/riemann";

export var SETTINGS = {
    nBands: 0,
    nChannels: 0,
    hdDim: 0,
    classLabels: [0, 1, 2],
    useTSpaceNGrams: false
}

export class HdcCiMBase {
    /** @type {number} - hyperdimension */
    _hdDim;
    /** @type {number} number of frequency band */
    _nBands;
    /** @type {number} Number of channels of the EEG recording device */
    _nChannels;
    /** @type {number} number of dimensions in tangent space */
    _nTSpaceDims;
    /** @type {Riemann} Wasm backend */
    _riemann;
    /** @type {RiemannKernel_d} Riemann kernel in wasm backend */
    _riemannKernel;
    /** @type {number} Number of collected training trials */
    _nTrials;
    /** @type {number} Quantization level, defaults to 100 */
    _qLevel;
    /** @type {number[]} Labels of collected trials */
    _trialLabels;
    /** @type {number[]} Class label vector */
    _classLabels;
    /** @type {boolean} whether to use ngrams for the transformation of the tangent space. Defaults to false  */
    _useTSpaceNGrams;

    /**
     * 
     * @param {SETTINGS} settings
     * @param {Riemann} riemann
     */
    constructor(settings, riemann) {

        if (new.target === HdcCiMBase) { throw new TypeError("Cannot construct Abstract instances directly"); }
        if (this.fit === undefined) { throw new TypeError("child classes must implement fit method"); }
        if (this.predict === undefined) { throw new TypeError("child classes must implement predict method"); }

        // ------------------------------
        this._riemann = riemann;
        this._riemannKernel = riemann.RiemannKernel();
        this._riemannKernel.setMeanMetric(riemann.EMetric.Euclidian);
        this._hdDim = settings.hdDim;
        this._nBands = settings.nBands;
        this._nChannels = settings.nChannels;
        this._nTSpaceDims = (settings.nChannels * (settings.nChannels + 1)) / 2;
        this._nTrials = 0;
        this._qLevel = 101;
        this._trialLabels = [];
        this._classLabels = settings.classLabels;
        if (settings.useTSpaceNGrams) {
            this._useTSpaceNGrams = settings.useTSpaceNGrams;
        } else {
            this._useTSpaceNGrams = false;
        }
    }

    /**
     * Adds a training trial
     * @param {Timetensor_d} timetensor 
     */
    collectTrial(timetensor, label) {
        this._riemannKernel.addTrial(timetensor);
        this._nTrials += 1;
        this._trialLabels.push(label);
    }    
    

    /**
     * Quantizes tangent space via formula:
     * int( (x - mean) * (q / sigma) + (q - 1) / 2) )
     * x, 1 / (1 + np.exp(-10*x)) - distributes better
     * 
     * 1 / (1 + exp(-10* ((x - mean) * (1 / sigma)) ) ) * q
     * @param {tf.Tensor3D} trainTensor - of shape (nTrials, nBands, nTSpaceDims)
     */
    _quantize(trainTensor, nTrials) {
        const vm = this;
        const alpha = 15;
        return tf.tidy(() => {
            // moments
            const moments = tf.moments(trainTensor, 2);
            const std = moments.variance.sqrt();
            const sigma = std.mul(tf.scalar(6)).reshape([nTrials, vm._nBands, 1]).tile([1, 1, vm._nTSpaceDims]);
            const means = moments.mean.reshape([nTrials, vm._nBands, 1]).tile([1, 1, vm._nTSpaceDims]);

            // int( (x - mean) * (q / sigma) + (q - 1) / 2) )
            trainTensor = trainTensor.sub(means);
            trainTensor = trainTensor.div(sigma);
            trainTensor = tf.tensor3d([1], [1, 1, 1]).tile([nTrials, vm._nBands, vm._nTSpaceDims])
                                .div(
                                    tf.exp(trainTensor.mul(tf.scalar(-alpha))).add(tf.scalar(1))
                                )
            trainTensor = trainTensor.mul(tf.scalar(vm._qLevel));

            // clip to quantization levels
            trainTensor = trainTensor.toInt().clipByValue(0, vm._qLevel - 1);

            return trainTensor
        });
    }
}