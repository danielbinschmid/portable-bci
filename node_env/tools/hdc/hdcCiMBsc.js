import * as tf from '@tensorflow/tfjs-node-gpu';
import { maxIdx } from '../../evaluation/data_utils/array_utils';
import { bernoulli } from './hdc_utils/probability';
import { Riemann } from "../riemann/riemann";
import { HdcCiMBase, SETTINGS } from "./hdcCiMBase";


export class HdcCiMBsc extends HdcCiMBase {
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

        [this._iMBands, this._iMTSpace] = this._genItemMemory();
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
            const tensor = vm._encodeBatch(buffer_cpp, 1);
            return vm._queryAM(tensor);
        })

        const predictionArray = await prediction.array();
        prediction.dispose();

        return predictionArray
    }

    /**
     * 
     * @param {tf.Tensor2D} trial 
     */
    _queryAM(trial) {
        const vm = this;
        return tf.tidy(() => {
            return vm._AM.logicalXor(trial).logicalXor(tf.scalar(true, 'bool')).sum(1).div(tf.scalar(vm._hdDim));
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
                    var trialTensor_ = vm._CiMEmbedding.apply(trial).toBool();
                    if (!this._useTSpaceNGrams) {
                        trialTensor_ = this._transformTSpace(trialTensor_);
                    } else {
                        trialTensor_ = this._transformTSpaceNGram(trialTensor_);
                    }
                    trialTensor_ = this._transformFBands(trialTensor_);
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
            var trialTensor_ = trialTensor.logicalXor(vm._iMTSpace);
            trialTensor_ = trialTensor_.toInt();
            trialTensor_ = trialTensor_.sum(1); // result: (nBands, hdDim)

            const threshhold = Math.floor(vm._nTSpaceDims / 2);
            const threshholdTensor = tf.scalar(threshhold);
            trialTensor_ = trialTensor_.clipByValue(threshhold, threshhold + 1).sub(threshholdTensor).toBool();
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
            var trialTensor_ = trialTensor.logicalXor(vm._iMBands);
            trialTensor_ = trialTensor_.toInt();
            trialTensor_ = trialTensor_.sum(0); // result: (nBands, hdDim)

            const threshholdBands = Math.floor(vm._nBands / 2);
            const threshholdTensorBands = tf.scalar(threshholdBands);
            trialTensor_ = trialTensor_.clipByValue(threshholdBands, threshholdBands + 1).sub(threshholdTensorBands).toBool();
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
                const threshhold = Math.floor(classLabels.length / 2);

                classSymbol = classSymbol.clipByValue(threshhold, threshhold + 1).sub(tf.scalar(threshhold)).toBool();
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
        const iMBands = tf.rand([this._nBands, this._hdDim], bernoulli, 'bool');
        const iMTSpace = tf.rand([this._nTSpaceDims, this._hdDim], bernoulli, 'bool');
        return [iMBands, iMTSpace];
    }

    /**
     * Initializes continuous item memory. 
     */
    _genCiM() {
        // create random init vector
        const Levels = []
        const L0 = []
        for (var i = 0; i < this._hdDim; i++) { L0.push(bernoulli()); }
        Levels.push(L0);

        // create other levels from init level
        var currentLevel = [...L0];

        for (var q = 0; q < this._qLevel - 1; q++) {
            // find indeces to flip
            const indeces = []
            for (var i = 0; i < this._hdDim / (this._qLevel - 1); i++) {
                var idx = Math.floor((Math.random() * this._hdDim));
                while (indeces.findIndex((val, ind, arr) => { ind == idx }) != -1) { idx = Math.floor((Math.random() * this._hdDim)); }
                indeces.push(idx);
            }

            // flip indeces
            for (const idx of indeces) {
                currentLevel[idx] = currentLevel[idx] == false;
            }

            // add level
            var currentLevelCopy = [...currentLevel];
            Levels.push(currentLevelCopy);
        }


        // init embedding
        const CiM = tf.tensor2d(Levels, [this._qLevel, this._hdDim]);
        const embedding = tf.layers.embedding({
            inputDim: this._qLevel,
            outputDim: this._hdDim,
            trainable: false,
            weights: [CiM]
        });
        this._CiMEmbedding = embedding;
    }


    /**
     * @param {tf.Tensor3D} trialTensor shape (nBands, nTSpaceDim, hdDim)
     * @returns {tf.Tensor2D}
     */
     _transformTSpaceNGram(trialTensor) {
        const vm = this;
        const t = tf.tidy(() => {
            const shifted = [];
            for (var Tidx = 0; Tidx < this._nTSpaceDims; Tidx++) {
                var tSpaceDim = trialTensor.gather(tf.tensor1d([Tidx], 'int32'), 1);
                const part1 = tSpaceDim.slice([0, 0, Tidx], [this._nBands, 1, this._hdDim - Tidx]);
                const part2 = tSpaceDim.slice([0, 0, 0], [this._nBands, 1, Tidx]);
                tSpaceDim = part1.concat(part2, 2);
                shifted.push(tSpaceDim)
            }
            var trialTensor_ = tf.concat(shifted, 1);
            // multiply vecs
            const bandTensors = trialTensor_.unstack();
            const bandTensorsNew = [];
            for (const bandTensor of bandTensors) {
                const nTSpaceVecs = bandTensor.unstack();
                var currentVec = nTSpaceVecs[0];
                
                for (var i = 1; i < nTSpaceVecs.length; i++) {
                    currentVec = currentVec.logicalXor(nTSpaceVecs[i]);
                }
                bandTensorsNew.push(currentVec);
            }
            trialTensor_ = tf.stack(bandTensorsNew);

            return trialTensor_;
        })
        return t;
    }
}