import * as tf from "@tensorflow/tfjs-node-gpu"
import { arange, shuffle, maxIdx } from "../../evaluation/data_utils/array_utils";


export class HdcCnnAddonfHrr {
    _hdDim;
    _nnOutputShape;
    _qLevel;
    /** @type {tf.Tensor2D[]} */
    _iM;
    /** @type {tf.layers.Layer} */
    _CiMEmbedding;
    _AM;
    _classLabels;

    constructor(hdDim, nnOutputShape, qLevel) {
        this._hdDim = hdDim;
        this._nnOutputShape = []
        for (const s of nnOutputShape) { if (s > 1) { this._nnOutputShape.push(s); } }
        this._nnOutputShape = nnOutputShape;
        this._qLevel = qLevel;
        this._geniM();
        this._genCiM();
        this._classLabels = [0, 1, 2]
    }

    /**
     * 
     * @param {tf.Tensor} batch 
     */
    async fit(batch, labels, retrain=false, lr=.1, its=8) {
        const AM = tf.tidy(() => {
            var now = Date.now()
            var x = this._encodeBatch(batch);
            console.log("encoding training batch took " + (Date.now() - now ))
            now = Date.now()
            var AM = this._genAMNaive(x, labels) 
            console.log("Generating AM took " + (Date.now() - now ))
            if (retrain) {
                AM = this._retrainAM(x, labels, AM, lr, its);
            }
            
            return AM;
        });
        this._AM = AM;
    }

    async predictOnBatch(batch) {
        const probs = tf.tidy(() => {
            var x = this._encodeBatch(batch).unstack();
            const probsAll = []
            for (const trial of x) {
                const prob = this._queryAM(trial).arraySync();
                probsAll.push(prob);
            }
            return probsAll
        });
        return probs;
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
     * @param {tf.Tensor} batch 
     */
    _encodeBatchOld(batch) {
        const enc = tf.tidy(() => {
            const trials = batch.unstack();
            const encodedBatch = []
            for (const trial of trials) {
                const encoded = tf.tidy(() => {
                    var z = this._quantize(trial.reshape(this._nnOutputShape));
                    z = this._CiMEmbedding.apply(z);
                    for (const levelIdx of arange(0, this._iM.length)) {

                        // bind level
                        const level = this._iM[this._iM.length - levelIdx - 1];
                        const reshape_shape = []
                        const tile_shape = []
                        for (const j of arange(0, this._iM.length - levelIdx - 1)) {
                            reshape_shape.push(1);
                            tile_shape.push(this._nnOutputShape[j]);
                        }
                        reshape_shape.push(...level.shape);
                        tile_shape.push(...[1, 1]);
                        z = this._bind(z, level.reshape(reshape_shape).tile(tile_shape));
                        // bundle level
                        z = this._bundle(z, this._iM.length - levelIdx - 1);
                    }
                    return z;
                })
                encodedBatch.push(encoded);
            }
            return tf.stack(encodedBatch);
        })
        return enc;
    }

    /**
     * 
     * @param {tf.Tensor2D} batch 
     */
    _encodeBatch(batch) {
        const enc = tf.tidy(() => {

            const encoded = tf.tidy(() => {
                const nTrials = batch.shape[0]
                console.log(batch.shape)
                var z = this._quantize(batch.reshape([nTrials, 16, 16]));
                console.log(z.shape)
                z = this._CiMEmbedding.apply(z);
                console.log(z.shape)
                for (const levelIdx of arange(0, this._iM.length)) {
                    console.log(levelIdx)
                    // bind level
                    const level = this._iM[this._iM.length - levelIdx - 1];
                    const reshape_shape = [1]
                    const tile_shape = [nTrials]
                    for (const j of arange(0, this._iM.length - levelIdx - 1)) {
                        reshape_shape.push(1);
                        tile_shape.push(this._nnOutputShape[j]);
                    }
                    reshape_shape.push(...level.shape);
                    tile_shape.push(...[1, 1]);
                    console.log(reshape_shape)
                    console.log(tile_shape)
                    z = this._bind(z, level.reshape(reshape_shape).tile(tile_shape));
                    console.log(z.shape)
                    // bundle level
                    z = this._bundle(z, this._iM.length - levelIdx);
                    console.log(z.shape)
                }
                return z;
            })

            return encoded;

        })
        return enc;
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

    retrain(trainingSet, labels, lr, its) {
        const b = this._encodeBatch(trainingSet);
        this._AM = this._retrainAM(b, labels, this._AM, lr, its);
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
     * @param {tf.Tensor} batch 
     */
    _quantize(batch) {
        const quantized = tf.tidy(() => {
            var x = tf.tanh(batch);
            x = x.add(tf.scalar(1)).div(tf.scalar(2)).mul(tf.scalar(this._qLevel));
            x = x.clipByValue(0, this._qLevel - 1);
            x = x.toInt();
            return x;
        });
        return quantized;
    }

    _geniM() {
        this._iM = []
        for (const dim of this._nnOutputShape) {
            const x = tf.randomUniform([dim, this._hdDim], 0, 2 * Math.PI, "float32")
            this._iM.push(x);
        }
    }

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