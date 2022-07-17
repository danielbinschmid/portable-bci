import * as tf from '@tensorflow/tfjs-node-gpu';
// import '@tensorflow/tfjs-backend-wasm';
// import { randomUniformVariable } from '@tensorflow/tfjs-layers/dist/variables';
import { arange, maxIdx, shuffle, flatten2 } from '../../evaluation/data_utils/array_utils';
import { bernoulli } from './hdc_utils/probability';
import tqdm from "ntqdm";
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
    /** @type {tf.layers.Layer} Continuous item memory for quantization mapping */
    _CiMEmbedding;
    /** @type {tf.Tensor2D} Associative memory */
    _AM;

    /**
     * 
     * @param {SETTINGS} settings
     * @param {Riemann} riemann
     */
    constructor(settings, riemann) {

        if (new.target === HdcCiMBase) { throw new TypeError("Cannot construct Abstract instances directly"); }
        if (this._vecSimilarity === undefined) { throw new TypeError("_vecSimilarity method must be defined"); }
        if (this._bundle === undefined) { throw new TypeError("_bundle method must be defined"); }
        if (this._transformFBands === undefined) { throw new TypeError("_transformFBands method must be defined"); }
        if (this._transformTSpace === undefined && !settings.useTSpaceNGrams) { throw new TypeError("configuration mismatch: useTSpaceNGrams"); }
        if (this._transformTSpaceNGram === undefined && settings.useTSpaceNGrams) { throw new TypeError("configuration mismatch: useTSpaceNGrams"); }

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
     * 1 / (1 + exp(-alpha* ((x - mean) * (1 / sigma)) ) ) * q
     * @param {tf.Tensor3D} trainTensor - of shape (nTrials, nBands, nTSpaceDims)
     */
    _quantize(trainTensor, nTrials) {
        const vm = this;
        const alpha = 15;
        return tf.tidy(() => {
            // moments
            // moments
            const moments = tf.moments(trainTensor, 2);
            const std = moments.variance.sqrt();
            const sigma = std.mul(tf.scalar(3)).reshape([nTrials, vm._nBands, 1]).tile([1, 1, vm._nTSpaceDims]);
            const means = moments.mean.reshape([nTrials, vm._nBands, 1]).tile([1, 1, vm._nTSpaceDims]);

            // int( (x - mean) * (q / sigma) + (q - 1) / 2) )
            var batchTensor = trainTensor.sub(means);
            batchTensor = batchTensor.div(sigma);
            batchTensor = batchTensor.mul(tf.scalar(vm._qLevel));
            batchTensor = batchTensor.add(tf.scalar((vm._qLevel - 1) / 2)).toInt();

            // clip to quantization levels
            batchTensor = batchTensor.clipByValue(0, vm._qLevel - 1);

            return batchTensor
        });
    }

    /**
     * Quantizes tangent space via formula:
     * int( (x - mean) * (q / sigma) + (q - 1) / 2) )
     * x, 1 / (1 + np.exp(-10*x)) - distributes better
     * 
     * 1 / (1 + exp(-alpha* ((x - mean) * (1 / sigma)) ) ) * q
     * @param {tf.Tensor3D} trainTensor - of shape (nTrials, nBands, nTSpaceDims)
     */
    _unusedQuantized(trainTensor, nTrials) {
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

    getQuanitizedTrials() {
        // fit riemann and collect buffer for training
        const trainBuffer_ = this._riemann.ArrayBuffer();
        this._riemannKernel.fitTrials(trainBuffer_);

        var typedArr = this._riemann.ArrayBufferToTypedArray(trainBuffer_);
        typedArr = new Float32Array(typedArr);

        const vm = this;
        const batchTensor = tf.tidy(() => {
            var trainTensor = tf.tensor3d(typedArr, [this._nTrials, vm._nBands, vm._nTSpaceDims]);
            trainTensor = vm._quantize(trainTensor, this._nTrials);
            return trainTensor;
        });
        return batchTensor.arraySync();
    }

    clear() {
        this._riemannKernel.reset();
        this._nTrials = 0;
        this._trialLabels = [];
    }

    /**
     * Predicts the label of a trial/ timetensor
     * @param {Timetensor_d} timetensor 
     */
    async predict(timetensor) {
        const buffer_cpp = this._riemann.ArrayBuffer();
        this._riemannKernel.apply(timetensor, buffer_cpp);

        const vm = this;
        const prediction = tf.tidy(() => {
            const tensor = vm._encodeBatch(buffer_cpp, 1).reshape([vm._hdDim]);
            return vm._queryAM(tensor, vm._AM);
        })

        const predictionArray = await prediction.array();
        prediction.dispose();

        return predictionArray
    }

    /**tf.losses.cosineDistance(tf.tensor1d(level1), tf.tensor1d(level2)).toFloat();
     * 
     * @param {tf.Tensor1D} trial 
     * @returns {tf.Tensor1D}
     */
    _queryAM(trial, AM_ = this._AM) {
        const vm = this;
        return tf.tidy(() => {
            const AM = AM_.unstack();
            var dists = []
            for (const AMVec of AM) {
                dists.push(this._vecSimilarity(AMVec, trial));
                // dists.push(tf.scalar(1).sub(tf.losses.cosineDistance(AMVec, trial)));
            }
            dists = tf.stack(dists);
            return dists;
        });
    }

    /**
     * Fits the model to the collected trials
     * @param {boolean} emitTrainingAccuracy - whether to emit accuracy on training set
     */
    async fit(emitTrainingAccuracy = true) {
        const trainBuffer_ = this._riemann.ArrayBuffer();
        this._riemannKernel.fitTrials(trainBuffer_);

        const trainingSet = this._encodeBatch(trainBuffer_, this._nTrials);
        this._AM = this._genAM(trainingSet, this._trialLabels);

        var acc = null;
        if (emitTrainingAccuracy) { acc = this._predictBatch(trainingSet, this._trialLabels, this._AM); }
        trainingSet.dispose();
        this._resetTrialMetaData();
        return acc;
    }

    _resetTrialMetaData() {
        this._nTrials = 0;
        this._trialLabels = [];
    }

    /**
     * 
     * @param {tf.Tensor2D} trainingSet 
     */
    _genAMNaive(trainingSet, labels) {
        return tf.tidy(() => {
            const labelsWithIndeces = labels.map((val, ind) => [val, ind]);
            const classSymbols = [];
            for (const classIdx of this._classLabels) {
                const classLabels = labelsWithIndeces.filter((val, ind, arr) => val[0] == classIdx).map((val, ind) => val[1]);

                const classSymbol = tf.tidy(() => {
                    const classLabelsTensor = tf.tensor1d(classLabels, 'int32');
                    const classTrials = trainingSet.gather(classLabelsTensor);

                    var classSymbol = this._bundle(classTrials, 0);

                    return classSymbol;
                });
                classSymbols.push(classSymbol);
            }

            return tf.stack(classSymbols);
        });
    }


    /**
     * Encodes a batch of trials to their hypervector representations.
     * @param {ArrayBuffer_d} batchBuffer - of shape (nTrials, nBands, nFeats)
     * @param {number} nTrials
     * @returns {tf.Tensor2D} - shape (nTrials, hdDim)
     */
    _encodeBatch(batchBuffer, nTrials) {
        if (this._CiMEmbedding === undefined) { throw new TypeError("_CiMEmbedding must be defined for encoding"); }
        var typedArr = this._riemann.ArrayBufferToTypedArray(batchBuffer);
        typedArr = new Float32Array(typedArr);

        const vm = this;
        const batchTensor = tf.tidy(() => {
            var trainTensor = tf.tensor3d(typedArr, [nTrials, vm._nBands, vm._nTSpaceDims]);
            trainTensor = vm._quantize(trainTensor, nTrials);

            // unstack trials to prevent allocating the whole training set as single tensor
            const trials = trainTensor.unstack();
            const trialsTransformed = []
            for (const trial of trials) {
                const trialTensor = tf.tidy(() => {
                    var trialTensor_ = vm._CiMEmbedding.apply(trial);
                    if (!vm._useTSpaceNGrams) { trialTensor_ = vm._transformTSpace(trialTensor_); }
                    else { trialTensor_ = vm._transformTSpaceNGram(trialTensor_); }
                    trialTensor_ = vm._transformFBands(trialTensor_);
                    return trialTensor_
                });
                trialsTransformed.push(trialTensor);
            }
            const returnTensor = tf.stack(trialsTransformed);
            return returnTensor;
        });
        return batchTensor;
    }

    /**
     * Encodes a batch of trials to their hypervector representations.
     * @param {Float64Array} batchBuffer - of shape (nTrials, nBands, nFeats)
     * @param {number} nTrials
     * @returns {tf.Tensor2D} - shape (nTrials, hdDim)
     */
    _encodeArray(batchBuffer, nTrials) {
        if (this._CiMEmbedding === undefined) { throw new TypeError("_CiMEmbedding must be defined for encoding"); }
        var typedArr = new Float32Array(batchBuffer);

        const vm = this;
        const batchTensor = tf.tidy(() => {
            var trainTensor = tf.tensor3d(typedArr, [nTrials, vm._nBands, vm._nTSpaceDims]);
            trainTensor = vm._quantize(trainTensor, nTrials);

            // unstack trials to prevent allocating the whole training set as single tensor
            const trials = trainTensor.unstack();
            const trialsTransformed = []
            for (const trial of trials) {
                const trialTensor = tf.tidy(() => {
                    var trialTensor_ = vm._CiMEmbedding.apply(trial);
                    if (!vm._useTSpaceNGrams) { trialTensor_ = vm._transformTSpace(trialTensor_); }
                    else { trialTensor_ = vm._transformTSpaceNGram(trialTensor_); }
                    trialTensor_ = vm._transformFBands(trialTensor_);
                    return trialTensor_
                });
                trialsTransformed.push(trialTensor);
            }
            const returnTensor = tf.stack(trialsTransformed);
            return returnTensor;
        });
        return batchTensor;
    }

    /**
     * 
     * @param {tf.Tensor2D} trainingSet 
     */
    _genAM(trainingSet, labels) {
        return this._genAMNaive(trainingSet, labels);
    }

    _predictBatch(set, labels, AM) {
        const trainTensors = set.unstack();
        var nCorrects = 0;
        for (var trialIdx = 0; trialIdx < trainTensors.length; trialIdx++) {
            const probs = this._queryAM(trainTensors[trialIdx], AM);
            const pred = maxIdx(probs.arraySync());
            nCorrects += pred == labels[trialIdx];
        }
        const acc = nCorrects / trainTensors.length;
        return acc;
    }

    _sortSetForLabels(trainingSet, labels) {
        const labelsWithIndeces = labels.map((val, ind) => [val, ind]);
        const classes = []
        for (const classIdx of this._classLabels) {
            const classLabels = labelsWithIndeces.filter((val, ind, arr) => val[0] == classIdx).map((val, ind) => val[1]);
            const classTrials = trainingSet.gather(tf.tensor1d(classLabels, 'int32'));
            const classData = {}
            classData.label = classIdx;
            classData.trials = classTrials;
            classes.push(classData);
        }
        return classes;
    }


}