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

    _vecSim(a, b) {
        const vm = this;
        return tf.tidy(() => { 
            return a.logicalXor(b).logicalXor(tf.scalar(true, 'bool')).sum(0).div(tf.scalar(vm._hdDim));
        })
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
            trialTensor_ = vm._bundle(trialTensor_, 1);
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
            trialTensor_ = vm._bundle(trialTensor_, 0);
            return trialTensor_;
        });
    }

    /**
     * 
     * @param {tf.Tensor} tensor 
     * @param {number} axis 
     * @returns 
     */
    _bundle(tensor, axis) {
        return tf.tidy(() => {
            const nEls = tensor.shape[axis];
            var t = tensor.sum(axis);
            const threshhold = Math.floor(nEls / 2);
            return t.clipByValue(threshhold, threshhold + 1).sub(tf.scalar(threshhold)).toBool();
        })
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