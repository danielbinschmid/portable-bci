import { HdcCiMBase } from "./hdcCiMBase";
import * as tf from "@tensorflow/tfjs-node-gpu"
import { arange, isBelowPercentileVector } from "../../evaluation/data_utils/array_utils";

export class DimensionRankingBase {
    /** @type {HdcCiMBase} */
    _hdc;

    /**
     * 
     * @param {HdcCiMBase} hdc 
     */
    constructor(hdc) {
        this._hdc = hdc;
    }

    /**
     * @param {AMsData} AMsData
     */
    async fuseAMs(AMsData) {
        const AMs = AMsData.AMs;
        const importanceVecs = AMsData.importanceVecs;
        if (AMs.length != importanceVecs.length) { throw "list length mismatch in fuseAMs"; }

        const maxIndeces = tf.tidy(() => {
            const importanceVecsStacked = tf.stack(importanceVecs);
            const maxIndeces = importanceVecsStacked.argMax(0) // max index for each hyperdimension 
            return maxIndeces
        });

        const fusedAM = this._fuseAMs(maxIndeces, AMs);
        return fusedAM;
    }

    /**
     * 
     * @param {tf.Tensor1D} maxIndeces 
     * @param {tf.Tensor2D[]} AMs 
     */
    _fuseAMs(maxIndeces, AMs) {
        const nClasses = AMs[0].shape[0];

        const fusedAMs = tf.tidy(() => {
            const AMsStacked = tf.stack(AMs);

            var selection = maxIndeces.reshape([this._hdc._hdDim, 1]);
            const dimIndexTensor = this._dimIndexTensor().reshape([this._hdc._hdDim, 1])

            // gather class AM vector for each class in a list
            const fused = []
            for (const AMVecIdx of arange(0, nClasses)) {
                // gen index selection
                var selectionClass = selection.concat(tf.tensor1d([AMVecIdx], 'int32').reshape([1, 1]).tile([this._hdc._hdDim, 1]), 1)
                selectionClass = selectionClass.concat(dimIndexTensor, 1)

                // gather max indeces
                fused.push(tf.gatherND(AMsStacked, selectionClass))
            }

            return tf.stack(fused);
        });
        return fusedAMs;
    }

    /**
     * 
     * @param {AMsData} extraAMs 
     * @param {AMsData} centerAM 
     * @param {Number} percentile 
     */
    async fuseAMsCenter(extraAMs, centerAM, percentile = 0.2) {
        // indeces that should remain untouched
        const centerImportanceVec = centerAM.importanceVecs[0];
        const untouchedIndecesHV = tf.tensor1d(isBelowPercentileVector(centerImportanceVec.arraySync(), percentile), 'bool');

        // max index for each hyperdimension
        const importanceVecs = extraAMs.importanceVecs;
        importanceVecs.push(centerImportanceVec);
        const maxIndeces = tf.tidy(() => {
            const importanceVecsStacked = tf.stack(importanceVecs);
            var maxIndeces = importanceVecsStacked.argMax(0); // max index for each hyperdimension 
            maxIndeces = tf.where(untouchedIndecesHV, maxIndeces, tf.tensor1d([importanceVecs.length - 1], 'int32').tile([this._hdc._hdDim])); // mask max index with indeces that should remain untouched
            return maxIndeces;
        });

        // fuse AMs with adopted max indeces
        const AMs = extraAMs.AMs;
        AMs.push(centerAM.AMs[0]);
        const fusedAM = this._fuseAMs(maxIndeces, AMs);
        return fusedAM;
    }

    _dimIndexTensor() {
        const dims = []
        for (const i of arange(0, this._hdc._hdDim)) { dims.push(i); }
        return tf.tensor1d(dims, 'int32');
    }
}