import * as tf from '@tensorflow/tfjs-node-gpu';
// import '@tensorflow/tfjs-backend-wasm';
import { randomUniformVariable } from '@tensorflow/tfjs-layers/dist/variables';
import { maxIdx } from '../../evaluation/data_utils/array_utils';

export const Encodings = {
    THERMOMETER: 1
}

var ThermometerConfig = {
    q: 393, // must be provided by input
    embedding: null // gets computed tf.layers.embedding
}

import { Riemann } from "../riemann/riemann";
import { arange } from '../../evaluation/data_utils/array_utils';
// declare var riemann: Riemann;

export class HdcHersche {
    // data length configs
    _nBands; // number of frequency bands
    _nChannels; // number of channels of EEG device
    _nTrials;
    _hdDim; // the hypervector dimension
    _nVectorizedFeats; // number of features per timeseries, equals (_nBands * (_nBands + 1)) / 2

    // more configs
    _spatialTransformVals = {
        threshhold: 0,
        threshholdTensor: null
    };
    _classLabels;
    _encodingConfig; // the configuration parameters of the encoding

    // fields for computation
    _riemann;
    _riemannKernel; // vectorizes trials 
    _itemMemory;
    _associativeMemory;

    // data collection
    _supervisedTrialLabels;

    _embeddingsInitTensor;

    /**
     * 
     * @param {number} nBands - number of frequency bands. Defaults to 13.
     * @param {number} nChannels - number of channels of the recording device. Defaults to the four of the Muse
     * @param {Encodings} encodingType
     * @param {ThermometerConfig} encodingConfig
     * @param {Riemann} riemann
     */
    constructor(nBands = 16, nChannels = 4, classLabels = [0, 1], encodingType = Encodings.THERMOMETER, encodingConfig = ThermometerConfig, riemann = null) {

        // get tf backend config info
        // console.log("backend:")
        // tf.setBackend('webgl');
        // console.log(tf.getBackend())

        // -------- configs ---------
        // Computation configs
        this._riemann = riemann;

        this._riemannKernel = this._riemann.RiemannKernel();
        this._riemannKernel.setMeanMetric(riemann.EMetric.Euclidian);
        this._associativeMemory = tf.tensor2d([1], [1, 1]);

        // data length configs
        this._nTrials = 0;
        this._nBands = nBands;
        this._nChannels = nChannels;
        this._nVectorizedFeats = (nChannels * (nChannels + 1)) / 2;

        // more configs
        this._encodingConfig = encodingConfig;
        this._encodingType = encodingType;
        this._classLabels = classLabels;

        // data
        this._supervisedTrialLabels = [];


        // configs which require initialization computation
        switch (encodingType) {
            case Encodings.THERMOMETER:
                this._hdDim = encodingConfig.q * this._nVectorizedFeats;
                this._encodingConfig.embedding = this._genThermometerEmbedding();
                break;
            default:
                this._encodingConfig._hdDim = 0;
        }

        // item memory
        this._itemMemory = this._genItemMemory();

        // spatial transform
        this._spatialTransformVals.threshhold = Math.floor(this._nBands / 2);
        this._spatialTransformVals.threshholdTensor = tf.scalar(this._spatialTransformVals.threshhold);
    }


    _genThermometerEmbedding() {
        // -------- init embedding ---------
        // init embedding tensor
        const levelEmbeddings = []
        for (var level = 0; level < this._encodingConfig.q; level++) {
            const levelEmbedding = []
            for (var heat = 0; heat <= level; heat++) {
                levelEmbedding.push(1.0);
            }
            for (var cold = heat; cold < this._encodingConfig.q; cold++) {
                levelEmbedding.push(0.0);
            }
            levelEmbeddings.push(levelEmbedding);
        }
        this._embeddingsInitTensor = tf.tensor2d(levelEmbeddings, [this._encodingConfig.q, this._encodingConfig.q], 'float32');
        // init embedding layer
        const embedding = tf.layers.embedding({
            inputDim: this._encodingConfig.q,
            outputDim: this._encodingConfig.q,
            trainable: false,
            weights: [this._embeddingsInitTensor]
        });
        // ----------------------------------
        return embedding;
    }

    _bernoulli() {
        var x = Math.random();
        if (x < 0.5) {
            return 0;
        } else {
            return 1;
        }
    }

    /**
     * Generates HDC item memory.
     * @returns {tf.Tensor2D} - of shape (nFrequencyBands, hdDim)
     */
    _genItemMemory() {
        const iM = tf.rand([this._nBands, this._hdDim], this._bernoulli, 'bool');
        return iM;
    }


    /**
     * 
     * @param {Float32Array | Float64Array} batch 
     * @param {number} nTrials 
     * @returns {tf.Tensor3D} of shape (nTrials, nFBands, nhalfVectorized)
     */
    encodeBatch(batch, nTrials) {
        switch (this._encodingType) {
            case Encodings.THERMOMETER:
                // sample to 2D tensor
                var now = Date.now();
                const batchArray = Float32Array.from(batch);
                var vm = this;

                const batchTensor = tf.tidy(() => {
                    var batchTensor = tf.tensor3d(batchArray, [nTrials, vm._nBands, vm._nVectorizedFeats], 'float32');

                    // moments
                    const moments = tf.moments(batchTensor, 2);
                    const std = moments.variance.sqrt();
                    const sigma = std.mul(tf.scalar(3)).reshape([nTrials, vm._nBands, 1]).tile([1, 1, vm._nVectorizedFeats]);
                    const means = moments.mean.reshape([nTrials, vm._nBands, 1]).tile([1, 1, vm._nVectorizedFeats]);

                    // int( (x - mean) * (q / sigma) + (q - 1) / 2) )
                    batchTensor = batchTensor.sub(means);
                    batchTensor = batchTensor.div(sigma);
                    batchTensor = batchTensor.mul(tf.scalar(vm._encodingConfig.q));
                    batchTensor = batchTensor.add(tf.scalar((vm._encodingConfig.q - 1) / 2)).toInt();

                    // clip to quantization levels
                    batchTensor = batchTensor.clipByValue(0, vm._encodingConfig.q - 1);

                    // insert embedding and flatten
                    batchTensor = vm._encodingConfig.embedding.apply(batchTensor).toBool();
                    batchTensor = batchTensor.reshape([nTrials, vm._nBands, vm._hdDim]);
                    return batchTensor;
                });
                return batchTensor;
            default:
                return null;
        }
    }

    /**
     * 
     * @param {tf.Tensor3D} batchTensor - of shape (trials, nFBands, hdDim)
     * @returns {tf.Tensor2D}
     */
    spatialTransform(batchTensor) {
        var vm = this;
        const batchTensor_ = batchTensor;


        const batchTensorReturn = tf.tidy(() => {
            // bind
            var batchTensor = batchTensor_.logicalXor(vm._itemMemory);

            // bundle
            batchTensor = batchTensor.toInt();
            batchTensor = batchTensor.sum(1); // result: (trials, hdDim)

            // clip
            const threshhold = vm._spatialTransformVals.threshhold;
            const threshholdTensor = vm._spatialTransformVals.threshholdTensor;
            batchTensor = batchTensor.clipByValue(threshhold, threshhold + 1).sub(threshholdTensor).toBool();

            return batchTensor;
        });

        return batchTensorReturn;

    }


    /**
     * 
     * @param {Timetensor_d} timetensor 
     */
    collectTrial(timetensor, label) {

        if (timetensor.isCov) {
            this._riemannKernel.addTrial(timetensor);
        }
        else {
            throw "No covariance computation beyond the wasm backend available"
        }
        this._nTrials += 1;
        this._supervisedTrialLabels.push(label);
    }

    /**
     * 
     * @param {Timetensor_d} timetensor 
     */
    collectBreak(timetensor) {
        if (timetensor.isCov) {
            this._riemannKernel.addBreak(timetensor);
        }
        else {
            throw "No covariance computation beyond the wasm backend available"
        }
    }

    newSession() {
        this._riemannKernel.reset();
    }

    /**
     * 
     * @returns {number} - time for completion
     */
    async adaptToBreaks() {
        var now = Date.now();
        this._riemannKernel.fitBreaks();
        return Date.now() - now;
    }

    /**
     * 
     * @param {*} preLoadedData - has fields data, nTrials, labels
     * @returns 
     */
    async fit(preLoadedData = null) {
        const runTimeMeasures = { riemannMeanPlusCovs: 0, wasmToBuffer: 0, hdcEncoding: 0, hdcAMCreation: 0 };
        var now = Date.now();

        // riemann methods or load data
        var trainingBuffer = []

        if (!preLoadedData) {
            const trainTrials = this._riemann.ArrayBuffer();
            this._riemannKernel.fitTrials(trainTrials);
            runTimeMeasures.riemannMeanPlusCovs = Date.now() - now;
            now = Date.now();

            trainingBuffer = this._riemann.ArrayBufferToTypedArray(trainTrials);
            runTimeMeasures.wasmToBuffer = Date.now() - now;
            now = Date.now();
        }
        else {
            this._nTrials = preLoadedData.nTrials;
            trainingBuffer = preLoadedData.data;
            this._supervisedTrialLabels = preLoadedData.labels;
        }

        // encoding
        var vm = this;
        const trainingBatchTensors = tf.tidy(() => {
            const t1 = vm.encodeBatch(trainingBuffer, vm._nTrials);
            const t2 = vm.spatialTransform(t1); // shape (nTrials, hdDim)
            return t2;
        });

        runTimeMeasures.hdcEncoding = Date.now() - now;
        now = Date.now();

        const labels = this._supervisedTrialLabels.map((val, ind) => [val, ind]);
        const classSymbols = [];

        for (const classIdx of this._classLabels) {

            const classLabels = labels.filter((val, ind, arr) => val[0] == classIdx).map((val, ind) => val[1]);

            const classSymbol = tf.tidy(() => {
                const classLabelsTensor = tf.tensor1d(classLabels, 'int32');
                const classTrials = trainingBatchTensors.gather(classLabelsTensor);

                var classSymbol = classTrials.sum(0);
                const threshhold = Math.floor(classLabels.length / 2);

                classSymbol = classSymbol.clipByValue(threshhold, threshhold + 1).sub(tf.scalar(threshhold)).toBool();
                return classSymbol;
            });

            classSymbols.push(classSymbol);
        }

        tf.dispose(this._associativeMemory);
        this._associativeMemory = tf.stack(classSymbols);

        tf.dispose(classSymbols);
        tf.dispose(trainingBatchTensors);
        runTimeMeasures.hdcAMCreation = Date.now() - now;

        this._nTrials = 0;
        this._supervisedTrialLabels = [];
        return runTimeMeasures;
    }

    /**
    * 
    * @param {*} preLoadedData - has fields data, nTrials, labels
    * @returns 
    */
    async _retrain(preLoadedData, existingAM, alpha) {
        // load data
        this._nTrials = preLoadedData.nTrials;
        const trainingBuffer = preLoadedData.data;
        this._supervisedTrialLabels = preLoadedData.labels;

        // encoding
        var vm = this;
        const trainingBatchTensors = tf.tidy(() => {
            const t1 = vm.encodeBatch(trainingBuffer, vm._nTrials);
            const t2 = vm.spatialTransform(t1); // shape (nTrials, hdDim)
            return t2;
        });

        const labels = this._supervisedTrialLabels.map((val, ind) => [val, ind]);
        const classSymbols = [];

        for (const classIdx of this._classLabels) {

            const classLabels = labels.filter((val, ind, arr) => val[0] == classIdx).map((val, ind) => val[1]);
            const nTrialsLabel = classLabels.length
            const weightExisting = Math.floor(alpha * nTrialsLabel)

            const classSymbol = tf.tidy(() => {
                const classLabelsTensor = tf.tensor1d(classLabels, 'int32');
                var classTrials = trainingBatchTensors.gather(classLabelsTensor);

                for (const i of arange(0, weightExisting)) {
                    classTrials = tf.tidy(() => {
                        return classTrials.concat(existingAM[classIdx]); 
                    })
                }
                
                var classSymbol = classTrials.sum(0);
                const threshhold = Math.floor(classLabels.length / 2);

                classSymbol = classSymbol.clipByValue(threshhold, threshhold + 1).sub(tf.scalar(threshhold)).toBool();
                return classSymbol;
            });

            classSymbols.push(classSymbol);
        }

        tf.dispose(this._associativeMemory);
        this._associativeMemory = tf.stack(classSymbols);

        tf.dispose(classSymbols);
        tf.dispose(trainingBatchTensors);


        this._nTrials = 0;
        this._supervisedTrialLabels = [];

    }

    async refit(timetensorSet, labels) {
        const AMCopy = this._associativeMemory.unstack()

        for (const timetensor of timetensorSet) {
            this._riemannKernel.updateMean(timetensor, 4)
        }

        var trainingBuffer = []
        for (const timetensor of timetensorSet) {
            const buff = this._riemann.ArrayBuffer()
            this._riemannKernel.apply(timetensor, buff)
            const arrBuff = this._riemann.ArrayBufferToTypedArray(buff);
            trainingBuffer = trainingBuffer.concat(Array.from(arrBuff))
        }

        this._retrain({
            data: trainingBuffer,
            nTrials: labels.length,
            labels: labels
        }, AMCopy, 10)


        // make a training buffer 

    }

    /**
     * 
     * @param {Timetensor_d} trial 
     */
    async predict(trial) {
        const measures = { riemann: 0, conversionWasm: 0, hdcEncoding: 0, hdcAMQuery: 0, conversionTF: 0 };
        var now = Date.now();

        const buffer_cpp = this._riemann.ArrayBuffer()
        this._riemannKernel.apply(trial, buffer_cpp);
        measures.riemann = Date.now() - now;
        now = Date.now();

        const singleBatchBuffer = this._riemann.ArrayBufferToTypedArray(buffer_cpp);
        measures.conversionWasm = Date.now() - now;
        now = Date.now();

        const trialVecs = this.encodeBatch(singleBatchBuffer, 1);
        const hdcEmbedding = this.spatialTransform(trialVecs);
        measures.hdcEncoding = Date.now() - now;
        now = Date.now();

        var vm = this;
        var prediction = tf.tidy(() => {
            const [trial] = hdcEmbedding.unstack();
            return vm._associativeMemory.logicalXor(trial).logicalXor(tf.scalar(true, 'bool')).sum(1).div(tf.scalar(this._hdDim));
        });

        measures.hdcAMQuery = Date.now() - now;
        now = Date.now();

        const predictionArray = await prediction.array();
        measures.conversionTF = Date.now() - now;

        tf.dispose([trialVecs, hdcEmbedding, prediction]);
        return [predictionArray, measures]
    }

    async predictPreloadedFeats(feats) {
        const measures = { riemann: 0, conversionWasm: 0, hdcEncoding: 0, hdcAMQuery: 0, conversionTF: 0 };
        var now = Date.now();

        const trialVecs = this.encodeBatch(feats, 1);
        const hdcEmbedding = this.spatialTransform(trialVecs);
        measures.hdcEncoding = Date.now() - now;
        now = Date.now();

        const [trial] = hdcEmbedding.unstack();
        var prediction = this._associativeMemory.logicalXor(trial).logicalXor(tf.scalar(true, 'bool')).sum(1).div(tf.scalar(this._hdDim));
        measures.hdcAMQuery = Date.now() - now;
        now = Date.now();

        prediction = await prediction.array();
        measures.conversionTF = Date.now() - now;

        return [prediction, measures]
    }

    /**
     * 
     * @param {tf.Tensor2D} trainingSet 
     * @param {*} labels 
     * @param {*} AM 
     * @param {*} learning_rate 
     * @param {*} iterations 
     * @returns 
     */
    _retrainAM(trainingSet, labels, AM, learning_rate = 0.1, iterations = 20) {
        console.log("retraining ..");
        return tf.tidy(() => {
            AM = AM.unstack();
            for (const it of arange(0, iterations)) {
                AM = tf.tidy(() => {
                    const trainingTrials = trainingSet.unstack();
                    const AMUpdate = tf.zeros([this._classLabels.length, this._hdDim]).unstack();
                    const nAMUpdates = tf.zeros([this._classLabels.length]).arraySync();
                    var nCorrects = 0;
                    for (const trialIdx of arange(0, labels.length)) {
                        const trial = trainingTrials[trialIdx];
                        const probs = tf.stack(AM).logicalXor(trainingTrials[trialIdx]).logicalXor(tf.scalar(true, 'bool')).sum(1).div(tf.scalar(this._hdDim)).arraySync();
                        const prediction = maxIdx(probs);
                        // update AM
                        nCorrects += prediction == labels[trialIdx]

                        if (prediction != labels[trialIdx]) {
                            const rateTrue = tf.scalar(1).sub(tf.scalar(probs[labels[trialIdx]])).mul(tf.scalar(learning_rate));
                            const rateFalse = tf.scalar(1).sub(tf.scalar(probs[prediction])).mul(tf.scalar(learning_rate));
                            AMUpdate[labels[trialIdx]] = AMUpdate[labels[trialIdx]].add(trial.toFloat().mul(rateTrue));
                            AMUpdate[prediction] = AMUpdate[prediction].add(trial.logicalXor(tf.scalar(true)).toFloat().mul(rateFalse));
                            nAMUpdates[labels[trialIdx]] += rateTrue.arraySync();
                            nAMUpdates[prediction] += rateFalse.arraySync();
                        }
                        // AM[prediction] = AM[prediction].div(tf.mul(AM[prediction], AM[prediction]).sum(0).sqrt());
                    }
                    console.log(nAMUpdates)
                    console.log(nCorrects / labels.length)
                    for (const clIdx of arange(0, AMUpdate.length)) {
                        var fac = nAMUpdates[clIdx]

                        if (fac > 0) {
                            const AMUpdateVec = AMUpdate[clIdx].add(AM[clIdx].toFloat().mul(tf.scalar(fac * (1 - learning_rate))));
                            fac = fac + fac * (1 - learning_rate);
                            const threshhold = fac / 2;
                            const x = tf.relu(AMUpdateVec.sub(tf.scalar(threshhold))).toBool();
                            AM[clIdx] = x
                        }
                    }
                    return AM;
                })
            }
            return tf.stack(AM);
        })
    }

    destroy() {
        tf.dispose([this._associativeMemory, this._itemMemory, this._spatialTransformVals.threshholdTensor, this._embeddingsInitTensor]);
        this._encodingConfig.embedding.dispose();
    }

}