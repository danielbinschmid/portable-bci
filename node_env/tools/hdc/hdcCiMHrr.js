import * as tf from '@tensorflow/tfjs-node-gpu';
import { arange, maxIdx, shuffle } from '../../evaluation/data_utils/array_utils';
import { bernoulli } from './hdc_utils/probability';
import { Riemann } from "../riemann/riemann";
import { HdcCiMBase, SETTINGS } from "./hdcCiMBase";
import tqdm from "ntqdm";


export class HdcCiMHrr extends HdcCiMBase {
    /** @type {tf.Tensor2D} Item memory for frequency bands */
    _iMBands;
    /** @type {tf.Tensor2D} Item memory for tangent space dimensions */
    _iMTSpace;
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
        super(settings, riemann);

        this._genItemMemory();
        this._genCiM();
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
            return vm._queryAM(tensor);
        })

        const predictionArray = await prediction.array();
        prediction.dispose();

        return predictionArray
    }

    /**tf.losses.cosineDistance(tf.tensor1d(level1), tf.tensor1d(level2)).toFloat();
     * 
     * @param {tf.Tensor1D} trial 
     */
    _queryAM(trial) {
        const vm = this;
        return tf.tidy(() => {
            const AM = this._AM.unstack();
            var dists = []
            for (const AMVec of AM) {
                dists.push(tf.dot(AMVec, trial));
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
    async fit(emitTrainingAccuracy) {
        // fit riemann and collect buffer for training
        const trainBuffer_ = this._riemann.ArrayBuffer();
        this._riemannKernel.fitTrials(trainBuffer_);

        // create AM
        const trainingSet = this._encodeBatch(trainBuffer_, this._nTrials);
        this._genAM(trainingSet);

        var acc = null;
        if (emitTrainingAccuracy) {
            const trainTensors = trainingSet.unstack();
            var nCorrects = 0;
            for (var trialIdx = 0; trialIdx < trainTensors.length; trialIdx++) {
                const probs = this._queryAM(trainTensors[trialIdx]);
                const pred = maxIdx(probs.arraySync());
                nCorrects += pred == this._trialLabels[trialIdx];
            }
            acc = nCorrects / trainTensors.length;

            tf.dispose(trainTensors);
        }
        trainingSet.dispose();
        return acc;
    }

    /**
     * Encodes a batch of trials to their hypervector representations.
     * @param {ArrayBuffer_d} batchBuffer - of shape (nTrials, nBands, nFeats)
     * @param {number} nTrials
     * @returns {tf.Tensor2D} - shape (nTrials, hdDim)
     */
    _encodeBatch(batchBuffer, nTrials) {
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
                    if (!vm._useTSpaceNGrams) 
                    { trialTensor_ = vm._transformTSpace(trialTensor_); } 
                    else 
                    { throw new Error("ngrams for transforming tangent space not implemented"); }
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
     * @param {tf.Tensor3D} trialTensor - of shape (nBands, nTSpaceDims, hdDim) 
     * @returns {tf.Tensor2D} - of shape (nBands, hdDim)
     */
     _transformTSpace(trialTensor) {
        const vm = this;
        return tf.tidy(() => {
            // bind
            var trialTensor_ = tf.rfft(trialTensor);
            trialTensor_ = trialTensor_.mul(vm._iMTSpace.reshape([1, vm._nTSpaceDims, vm._iMTSpace.shape[1]]).tile([vm._nBands, 1, 1]));
            trialTensor_ = tf.irfft(trialTensor_);

            // bundle
            trialTensor_ = trialTensor_.sum(1);
            trialTensor_ = trialTensor_.div(tf.mul(trialTensor_, trialTensor_).sum(1).sqrt().reshape([this._nBands, 1]).tile([1, this._hdDim]));

            return trialTensor_;
        });
    }

    /**
     * 
     * @param {tf.Tensor2D} trialTensor - of shape (nBands, hdDim) 
     * @returns {tf.Tensor1D} - of shape (hdDim)
     */
    _transformFBands(trialTensor) {
        const vm = this;
        return tf.tidy(() => {
            // bind
            var trialTensor_ = tf.rfft(trialTensor);
            trialTensor_ = trialTensor_.mul(vm._iMBands);
            trialTensor_ = tf.irfft(trialTensor_);

            // bundle
            trialTensor_ = trialTensor_.sum(0);
            trialTensor_ = trialTensor_.div(tf.mul(trialTensor_, trialTensor_).sum(0).sqrt());

            return trialTensor_;
        });
    }

    /**
     * 
     * @param {tf.Tensor2D} trainingSet 
     */
     _genAM(trainingSet) {
        const labels = this._trialLabels.map((val, ind) => [val, ind]);
        const classSymbols = [];

        for (const classIdx of this._classLabels) {
            const classLabels = labels.filter((val, ind, arr) => val[0] == classIdx).map((val, ind) => val[1]);

            const classSymbol = tf.tidy(() => {
                const classLabelsTensor = tf.tensor1d(classLabels, 'int32');
                const classTrials = trainingSet.gather(classLabelsTensor);

                var classSymbol = classTrials.sum(0);
                classSymbol = classSymbol.div(tf.mul(classSymbol, classSymbol).sum(0).sqrt())

                return classSymbol;
            });
            classSymbols.push(classSymbol);
        }

        this._AM = tf.stack(classSymbols);

        tf.dispose(classSymbols);
    }

    /**
     * Generates HDC item memory.
     * @returns {tf.Tensor3D[]} - of shape (nFrequencyBands, hdDim)
     */
    _genItemMemory() {
        const iMBands = tf.randomNormal([this._nBands, this._hdDim], 0, 1 / Math.sqrt(this._hdDim), "float32");
        this._iMBands = tf.rfft(iMBands);

        const iMTSpace = tf.randomNormal([this._nTSpaceDims, this._hdDim], 0, 1 / Math.sqrt(this._hdDim), "float32");
        this._iMTSpace = tf.rfft(iMTSpace);
    }

    /**
     * Initializes continuous item memory. 
     */
    _genCiM() {
        const d = this._hdDim;
        const q = this._qLevel;

        if (d / (q - 1) - Math.floor(d/ (q - 1)) > 0) { throw new Error("Quantization level - 1 must divide hyperdimension"); }
        const mutationPartSize = d / (q + 1);

        // gen two ends
        const start = tf.randomNormal([d], 0, 1 / Math.sqrt(d)).arraySync();
        const end = tf.randomNormal([d], 0, 1 / Math.sqrt(d)).arraySync();

        var indeces = arange(0, d);
        shuffle(indeces);

        const allLevels = []
        var prevLevel = [...start];
        for (const qLevel of arange(0, q)) {
            const currentLevel = [...prevLevel];
            for (const j of arange(0, qLevel * (mutationPartSize))) {
                currentLevel[indeces[j]] = end[indeces[j]];
            }
            allLevels.push(currentLevel);
            prevLevel= currentLevel;
        }

        // init embedding
        const CiM = tf.tensor2d(allLevels, [this._qLevel, this._hdDim]);
        const embedding = tf.layers.embedding({
            inputDim: this._qLevel,
            outputDim: this._hdDim,
            trainable: false,
            weights: [CiM]
        });
        this._CiMEmbedding = embedding;
    }
}

export function testCiM() {
    const d = 10000;
    const q = 101;

    if (d / (q - 1) - Math.floor(d/ (q - 1)) > 0) { throw new Error("Quantization level - 1 must divide hyperdimension"); }

    const mutationPartSize = d / (q + 1);
    // gen two ends
    const start = tf.randomNormal([d], 0, 1 / Math.sqrt(d)).arraySync();
    const end = tf.randomNormal([d], 0, 1 / Math.sqrt(d)).arraySync();

    var indeces = arange(0, d);
    shuffle(indeces);

    const allLevels = []
    var prevLevel = [...start];
    for (const qLevel of arange(0, q)) {
        const currentLevel = [...prevLevel];
        for (const j of arange(0, qLevel * (mutationPartSize))) {
            currentLevel[indeces[j]] = end[indeces[j]];
        }
        allLevels.push(currentLevel);
        prevLevel= currentLevel;
    }
    

    var i = 0;
    for (const level1 of allLevels) {
        var j = 0;
        for (const level2 of allLevels) {
            // const cosDist = tf.losses.cosineDistance(tf.tensor1d(level1), tf.tensor1d(level2)).toFloat();
            const cosDist = tf.dot(tf.tensor1d(level1), tf.tensor1d(level2)).arraySync();
            console.log("cos dist betw. " + i + " & " + j +" = " + cosDist);
            j++;
        }  
        i++;
    }
}

