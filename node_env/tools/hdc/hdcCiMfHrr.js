import * as tf from '@tensorflow/tfjs-node-gpu';
import { arange, maxIdx, shuffle, flatten2 } from '../../evaluation/data_utils/array_utils';
import { bernoulli } from './hdc_utils/probability';
import { Riemann } from "../riemann/riemann";
import { HdcCiMBase, SETTINGS } from "./hdcCiMBase";
import { HdcCiMRetrainBase } from './hdcCiMRetrainBase';
import tqdm from "ntqdm";


export class HdcCiMfHrr extends HdcCiMRetrainBase {
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
     * @param {tf.Tensor} a 
     * @param {tf.Tensor} b 
     * @returns 
     */
    _vecSimilarity(a, b, axis = 0) {
        return tf.tidy(() => {
            return tf.cos(a.sub(b)).sum(axis).div(tf.scalar(this._hdDim))
        });

    }

    /**
     * 
     * @param {tf.Tensor} a
     * @param {tf.Tensor} b
     * @param {Number[]} weights
     */
    _bundleSingle(a, b, weights = undefined) {
        return tf.tidy(() => {
            if (weights === undefined) { weights = [1, 1]; }
            const imaginary = tf.sin(a).mul(tf.scalar(weights[0])).add(tf.sin(b).mul(tf.scalar(weights[1])));
            const real = tf.cos(a).mul(tf.scalar(weights[0])).add(tf.cos(b).mul(tf.scalar(weights[1])));
            return tf.atan2(imaginary.div(real), real);
        });
    }

    /**
     * 
     * @param {tf.Tensor} tensor
     * @param {tf.Tensor1D} weights
     * @param {Number} axis
     */
    _bundle(tensor, axis, weights = undefined) {
        return tf.tidy(() => {
            if (weights === undefined) { weights = tf.tensor1d([1]).tile([tensor.shape[axis]]) }
            const reshape_shape = []
            const tile_shape = []
            for (const sIdx of arange(0, tensor.shape.length)) {
                if (sIdx != axis) {
                    tile_shape.push(tensor.shape[sIdx]);
                    reshape_shape.push(1);
                }
                else {
                    tile_shape.push(1);
                    reshape_shape.push(tensor.shape[sIdx]);
                }
            }
            const weights_ = weights.reshape(reshape_shape).tile(tile_shape);

            const imaginary = tf.sin(tensor).mul(weights_).sum(axis);
            const real = tf.cos(tensor).mul(weights_).sum(axis);

            return tf.atan2(imaginary.div(real), real);
        });
    }



    /**
     * 
     * @param {tf.Tensor} a
     * @param {tf.Tensor} b
     */
    _bind(a, b) {
        return tf.tidy(() => {
            return a.add(b).mod(tf.scalar(2 * Math.PI));
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
            var trialTensor_ = this._bind(trialTensor, vm._iMTSpace.reshape([1, vm._nTSpaceDims, vm._iMTSpace.shape[1]]).tile([vm._nBands, 1, 1]))

            trialTensor_ = this._bundle(trialTensor_, 1)
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
            var trialTensor_ = this._bind(trialTensor, this._iMBands);

            // bundle
            trialTensor_ = this._bundle(trialTensor_, 0);

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

            for (const AMIdx of arange(0, AM.length)) {
                AM[AMIdx] = tf.complex(tf.cos(AM[AMIdx]), tf.sin(AM[AMIdx]))
            }

            const trainingTrials = trainingSet.unstack();

            for (const trialIdx of arange(0, labels.length)) {
                const trial = trainingTrials[trialIdx];
                const curAM = []
                for (const AMIdx of arange(0, AM.length)) {
                    curAM.push(tf.atan2(tf.imag(AM[AMIdx]).div(tf.real(AM[AMIdx])), tf.real(AM[AMIdx])));
                }
                const probs = this._queryAM(trial, tf.stack(curAM)).arraySync();
                const prediction = maxIdx(probs);
                // update AM
                const rateTrue = (2 - (probs[labels[trialIdx]] + 1)) * learning_rate * (1 / 2);
                const rateFalse = (2 - (probs[prediction] + 1)) * learning_rate * (1 / 2);
                const trial_ = tf.complex(tf.cos(trial), tf.sin(trial));

                if (prediction == labels[trialIdx]) {
                    AM[prediction] = tf.complex(
                        tf.real(AM[prediction]).add(tf.real(trial_).mul(tf.scalar(rateTrue))),
                        tf.imag(AM[prediction]).add(tf.imag(trial_).mul(tf.scalar(rateTrue)))
                    )
                }
                else 
                {
                    AM[labels[trialIdx]] = tf.complex(
                        tf.real(AM[labels[trialIdx]]).add(tf.real(trial_).mul(tf.scalar(rateTrue))),
                        tf.imag(AM[labels[trialIdx]]).add(tf.imag(trial_).mul(tf.scalar(rateTrue)))
                    )
                    AM[prediction] = tf.complex(
                        tf.real(AM[prediction]).sub(tf.real(trial_).mul(tf.scalar(rateFalse))),
                        tf.imag(AM[prediction]).sub(tf.imag(trial_).mul(tf.scalar(rateFalse)))
                    )
                }
            }

            const finalAM = []
            for (const AMIdx of arange(0, AM.length)) {
                finalAM.push(tf.atan2(tf.imag(AM[AMIdx]).div(tf.real(AM[AMIdx])), tf.real(AM[AMIdx])));
            }
            return tf.stack(finalAM);
        })
    }

    _retrainAMNaive(trainingSet, labels, AM) {
        return tf.tidy(() => {
            const trainingSetByLabel = this._sortSetForLabels(trainingSet, labels)
            const AMStack = AM.unstack();

            for (const c of arange(0, trainingSetByLabel.length)) {
                const label = trainingSetByLabel[c].label;
                const labelSet = trainingSetByLabel[c].trials.unstack();
                AMStack[label] = this._bundle(tf.stack([...labelSet, AMStack[label]]), 0)
            }
            return tf.stack(AMStack);
        })
    }

    _retrainAM(trainingSet, labels, AM, learning_rate = 0.2, iterations = 20) {
        console.log("retraining ..");
        return tf.tidy(() => {
            AM = AM.unstack();
            for (const AMIdx of arange(0, AM.length)) {
                AM[AMIdx] = tf.complex(tf.cos(AM[AMIdx]), tf.sin(AM[AMIdx]))
            }

            for (const it of arange(0, iterations)) {
                AM = tf.tidy(() => {
                    const trainingTrials = trainingSet.unstack();
                    var nCorrects = 0
                    for (const trialIdx of arange(0, labels.length)) {
                        /** @type {tf.Tensor} */
                        const trial = trainingTrials[trialIdx];
                        const curAM = []
                        for (const AMIdx of arange(0, AM.length)) {
                            curAM.push(tf.atan2(tf.imag(AM[AMIdx]).div(tf.real(AM[AMIdx])), tf.real(AM[AMIdx])));
                        }
                        const probs = this._queryAM(trial, tf.stack(curAM)).arraySync();
                        const prediction = maxIdx(probs);
                        nCorrects += prediction == labels[trialIdx]
                        // update AM

                        if (prediction != labels[trialIdx]) {
                            const rateTrue = (2 - (probs[labels[trialIdx]] + 1)) * learning_rate * (1 / 2);
                            const rateFalse = (2 - (probs[prediction] + 1)) * learning_rate * (1 / 2);
                            const trial_ = tf.complex(tf.cos(trial), tf.sin(trial));
                            AM[labels[trialIdx]] = tf.complex(
                                tf.real(AM[labels[trialIdx]]).add(tf.real(trial_).mul(tf.scalar(rateTrue))),
                                tf.imag(AM[labels[trialIdx]]).add(tf.imag(trial_).mul(tf.scalar(rateTrue)))
                            )
                            AM[prediction] = tf.complex(
                                tf.real(AM[prediction]).sub(tf.real(trial_).mul(tf.scalar(rateFalse))),
                                tf.imag(AM[prediction]).sub(tf.imag(trial_).mul(tf.scalar(rateFalse)))
                            )

                        }
                        // AM[prediction] = AM[prediction].div(tf.mul(AM[prediction], AM[prediction]).sum(0).sqrt());
                    }
                    console.log((nCorrects / labels.length) + " correct predictions during training")
                    return AM;
                })
            }
            const finalAM = []
            for (const AMIdx of arange(0, AM.length)) {
                finalAM.push(tf.atan2(tf.imag(AM[AMIdx]).div(tf.real(AM[AMIdx])), tf.real(AM[AMIdx])));
            }
            return tf.stack(finalAM);
        })
    }

    /**
     * 
     * @param {tf.Tensor2D} trainingSet 
     */
    _genAM(trainingSet, labels, initLr = 1, retrain = true, retrainingIts = 5, retrainingLr = 0.01) {
        const useOnlineHD = true;
        var AM = null

        console.log("here")
        if (useOnlineHD) {
            // AM = this._genAMOnlineHD(trainingSet, labels, initLr);
            AM = this._genAMNaive(trainingSet, labels);

            const accBeforeRetrain = this._predictBatch(trainingSet, labels, AM);
            console.log("accuracy on training set before retraining: " + accBeforeRetrain)
            if (retrain) {
                AM = this._retrainAM(trainingSet, labels, AM, retrainingLr, retrainingIts);
                console.log("retraining finished");
                const accAfterRetrain = this._predictBatch(trainingSet, labels, AM);
                console.log("accuracy on training set after retraining: " + accAfterRetrain);
            }

        }
        else { AM = this._genAMNaive(trainingSet, labels); }
        return AM;

    }


    /**
     * Generates HDC item memory.
     * @returns {tf.Tensor3D[]} - of shape (nFrequencyBands, hdDim)
     */
    _genItemMemory() {

        this._iMBands = tf.randomUniform([this._nBands, this._hdDim], 0, 2 * Math.PI, "float32")

        this._iMTSpace = tf.randomUniform([this._nTSpaceDims, this._hdDim], 0, 2 * Math.PI, "float32");
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
        const start = tf.randomUniform([d], 0, 2 * Math.PI, "float32").arraySync();
        const end = tf.randomUniform([d], 0, 2 * Math.PI, "float32").arraySync();

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
