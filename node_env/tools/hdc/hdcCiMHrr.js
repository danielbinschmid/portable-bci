import * as tf from '@tensorflow/tfjs-node-gpu';
import { arange, maxIdx, shuffle, flatten2 } from '../../evaluation/data_utils/array_utils';
import { bernoulli } from './hdc_utils/probability';
import { Riemann } from "../riemann/riemann";
import { HdcCiMBase, SETTINGS } from "./hdcCiMBase";
import { HdcCiMRetrainBase } from './hdcCiMRetrainBase';
import tqdm from "ntqdm";


export class HdcCiMHrr extends HdcCiMRetrainBase {
    /** @type {tf.Tensor2D} Item memory for frequency bands */
    _iMBands;
    /** @type {tf.Tensor2D} Item memory for tangent space dimensions */
    _iMTSpace;

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
     * Computes cosine similarity
     * @param {*} a 
     * @param {*} b 
     * @returns 
     */
    _vecSimilarity(a, b) {
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

    _bundle(tensor, axis) {
        return tf.tidy(() => {
            var t = tensor.sum(0)
            return t.div(tf.mul(t, t).sum(0).sqrt());
        });
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

