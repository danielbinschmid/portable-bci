import { HdcCiMBase, SETTINGS } from "./hdcCiMBase";
import * as tf from '@tensorflow/tfjs-node-gpu';
import { arange, maxIdx, shuffle, flatten2 } from '../../evaluation/data_utils/array_utils';
import { bernoulli } from './hdc_utils/probability';
import { Riemann } from "../riemann/riemann";
import tqdm from "ntqdm";

export class HdcCiMRetrainBase extends HdcCiMBase {
    constructor(settings, riemann) {
        super(settings, riemann);

        if (new.target === HdcCiMRetrainBase) { throw new TypeError("Cannot construct Abstract instances directly"); }
        if (this._retrainAM === undefined) { throw new TypeError("_retrainAM method must be implemented"); }
        if (this._genAMOnlineHD === undefined) { throw new TypeError("_retrainAM method must be implemented"); }

        
    }

    /**
     * 
     * @param {tf.Tensor2D} trainingSet 
     */
    _genAM(trainingSet, labels, initLr = 1, retrain = true, retrainingIts = 20, retrainingLr = 0.2) {
        const useOnlineHD = true;
        var AM = null
        if (useOnlineHD) {
            AM = this._genAMOnlineHD(trainingSet, labels, initLr);
            // AM = this._genAMNaive(trainingSet, labels);

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
}