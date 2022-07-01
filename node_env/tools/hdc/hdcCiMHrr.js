import * as tf from '@tensorflow/tfjs-node-gpu';
import { arange, maxIdx, shuffle, flatten2 } from '../../evaluation/data_utils/array_utils';
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
                dists.push(this._cosSimilarity(AMVec, trial));
                // dists.push(tf.scalar(1).sub(tf.losses.cosineDistance(AMVec, trial)));
            }
            dists = tf.stack(dists);
            return dists;
        });
    }

    _cosSimilarity(a, b) {
        return tf.dot(a, b).div(tf.mul(this._vecLength(a), this._vecLength(b)));
    }

    /**
     * 
     * @param {tf.Tensor1D} vec 
     */
    _vecLength(vec, axis=0) {
        return tf.tidy(() => {
            return tf.mul(vec, vec).sum(axis).sqrt();
        });
    }

    /**
     * Fits the model to the collected trials
     * @param {boolean} emitTrainingAccuracy - whether to emit accuracy on training set
     */
    async fit(emitTrainingAccuracy=true) {
        const trainBuffer_ = this._riemann.ArrayBuffer();
        this._riemannKernel.fitTrials(trainBuffer_);

        const trainingSet = this._encodeBatch(trainBuffer_, this._nTrials);
        this._AM = this._genAM(trainingSet, this._trialLabels);

        var acc = null;
        if (emitTrainingAccuracy) { acc = this._predictBatch(trainingSet, this._trialLabels, this._AM); }
        trainingSet.dispose();
        return acc;
    }

    /**
     * 
     * @param {Timetensor_d[][]} data 
     * @param {number[][]} labels 
     */
    async preFitToSubjects(data, labels, emitTrainingAccuracy=true) {
        const kernel = this._riemann.RiemannKernel();
        kernel.setMeanMetric(this._riemann.EMetric.Euclidian);
        const trainingSets = []
        const flattenedLabels = []
        for (const subjectIdx of arange(0, data.length)) {
            console.log("fitting riemann for subject " + subjectIdx + "..");
            kernel.reset();
            for (const trialIdx of arange(0,data[subjectIdx].length)) {
                kernel.addTrial(data[subjectIdx][trialIdx].trial);
                flattenedLabels.push(labels[subjectIdx][trialIdx] - 1);
            }
            const buf = this._riemann.ArrayBuffer();
            kernel.fitTrials(buf);
            console.log("encoding trials for subject " + subjectIdx + "..");
            const trainingSet = this._encodeBatch(buf, data[subjectIdx].length);
            trainingSets.push(trainingSet);
        }

        const trainingSet = tf.concat(trainingSets);
        tf.dispose(trainingSets);
        console.log("generating AM..");
        this._AM = this._genAM(trainingSet, flattenedLabels, 0.2, true, 50, 0.1);

    }

    async retrain(iterations, lr) {
        const trainBuffer_ = this._riemann.ArrayBuffer();
        this._riemannKernel.fitTrials(trainBuffer_);
        const trainingSet = this._encodeBatch(trainBuffer_, this._nTrials);

        const accBefore = this._predictBatch(trainingSet, this._trialLabels, this._AM);
        console.log("accuracy on training set before retraining: " + accBefore);

        var acc = null;
        this._AM = tf.tidy(() => {
            this._AM = this._retrainAM(trainingSet, this._trialLabels, this._AM, lr, iterations);
            acc = this._predictBatch(trainingSet, this._trialLabels, this._AM);
            console.log("accuracy on training set after retraining: " + acc);
            return this._AM;
        });
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
                    if (!vm._useTSpaceNGrams) { trialTensor_ = vm._transformTSpace(trialTensor_); }
                    else { throw new Error("ngrams for transforming tangent space not implemented"); }
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
    _genAM(trainingSet, labels, initLr=0.2 ,retrain=true, retrainingIts=50, retrainingLr=0.1) {
        const useOnlineHD = true;
        var AM = null
        if (useOnlineHD) {
            AM = this._genAMOnlineHD(trainingSet, labels , initLr);
            // AM = this._genAMNaive(trainingSet, labels);

            const accBeforeRetrain = this._predictBatch(trainingSet, labels, AM);
            console.log("accuracy on training set before retraining: " + accBeforeRetrain)
            if (retrain)
            {
                AM = this._retrainAM(trainingSet, labels, AM, retrainingLr, retrainingIts);
                console.log("retraining finished");
                const accAfterRetrain = this._predictBatch(trainingSet, labels, AM);
                console.log("accuracy on training set after retraining: " + accAfterRetrain);
            }
        }
        else { AM = this._genAMNaive(trainingSet, labels); }
        return AM;
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

    /**
     * 
     * @param {tf.Tensor2D} trainingSet 
     */
    _genAMOnlineHD(trainingSet, labels, learning_rate = 1) {

        return tf.tidy(() => {
            const labelsWithIndeces = labels.map((val, ind) => [val, ind]);
            /** @type {tf.Tensor1D[]} */
            const AM = [];

            // init AM with first occurrence of class
            for (const classIdx of this._classLabels) {
                const c = {}
                const classLabels = labelsWithIndeces.filter((val, ind, arr) => val[0] == classIdx).map((val, ind) => val[1]);
                if (classLabels[0] === undefined || classLabels[0] === null) { throw new Error("one class not present in training data"); }
                const classTrials = trainingSet.gather(tf.tensor1d([classLabels[0]], 'int32'));
                AM.push(classTrials.reshape([this._hdDim]));
            }

            const trainingTrials = trainingSet.unstack();

            for (const trialIdx of arange(0, labels.length)) {
                const trial = trainingTrials[trialIdx];
                const probs = this._queryAM(trial, tf.stack(AM)).arraySync();
                const prediction = maxIdx(probs);
                // update AM
                const rateTrue = tf.scalar(1).sub(tf.scalar(probs[labels[trialIdx]])).mul(tf.scalar(learning_rate));
                const rateFalse = tf.scalar(1).sub(tf.scalar(probs[prediction])).mul(tf.scalar(learning_rate));

                if (prediction == labels[trialIdx]) {
                    AM[prediction] = AM[prediction].add(trial.mul(rateTrue));
                }
                else {
                    AM[labels[trialIdx]] = AM[labels[trialIdx]].add(trial.mul(rateTrue));
                    AM[prediction].sub(trial.mul(rateFalse));
                }
            }

            for (const label of this._classLabels) {
                AM[label] = AM[label].div(tf.mul(AM[label], AM[label]).sum(0).sqrt());
            }

            return tf.stack(AM);
        })
    }

    _retrainAM(trainingSet, labels, AM, learning_rate = 0.2, iterations = 20) {
        console.log("retraining ..");
        return tf.tidy(() => {
            AM = AM.unstack();
            for (const it of tqdm(arange(0, iterations), { logging: true })) {
                AM = tf.tidy(() => {
                    const trainingTrials = trainingSet.unstack();
                    for (const trialIdx of arange(0, labels.length)) {
                        const trial = trainingTrials[trialIdx];
                        const probs = this._queryAM(trial, tf.stack(AM)).arraySync();
                        const prediction = maxIdx(probs);
                        // update AM

                        if (prediction != labels[trialIdx]) {
                            const rateTrue = tf.scalar(1).sub(tf.scalar(probs[labels[trialIdx]])).mul(tf.scalar(learning_rate));
                            const rateFalse = tf.scalar(1).sub(tf.scalar(probs[prediction])).mul(tf.scalar(learning_rate));
                            AM[labels[trialIdx]] = AM[labels[trialIdx]].add(trial.mul(rateTrue));
                            AM[prediction].sub(trial.mul(rateFalse));
                        }
                        // AM[prediction] = AM[prediction].div(tf.mul(AM[prediction], AM[prediction]).sum(0).sqrt());
                    }

                    for (const label of this._classLabels) {
                        AM[label] = AM[label].div(tf.mul(AM[label], AM[label]).sum(0).sqrt());
                    }
                    return AM;
                }) 
            }
            return tf.stack(AM);
        })
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

                    var classSymbol = classTrials.sum(0);
                    classSymbol = classSymbol.div(tf.mul(classSymbol, classSymbol).sum(0).sqrt());

                    return classSymbol;
                });
                classSymbols.push(classSymbol);
            }

            return tf.stack(classSymbols);
        });
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

        if (d / (q - 1) - Math.floor(d / (q - 1)) > 0) { throw new Error("Quantization level - 1 must divide hyperdimension"); }
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
            prevLevel = currentLevel;
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

    if (d / (q - 1) - Math.floor(d / (q - 1)) > 0) { throw new Error("Quantization level - 1 must divide hyperdimension"); }

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
        prevLevel = currentLevel;
    }


    var i = 0;
    for (const level1 of allLevels) {
        var j = 0;
        for (const level2 of allLevels) {
            // const cosDist = tf.losses.cosineDistance(tf.tensor1d(level1), tf.tensor1d(level2)).toFloat();
            const cosDist = tf.dot(tf.tensor1d(level1), tf.tensor1d(level2)).arraySync();
            console.log("cos dist betw. " + i + " & " + j + " = " + cosDist);
            j++;
        }
        i++;
    }
}

