import { HdcCiMBase, SETTINGS } from "./hdcCiMBase";
import * as tf from '@tensorflow/tfjs-node-gpu';
import { arange, maxIdx, shuffle, flatten2 } from '../../evaluation/data_utils/array_utils';
import { bernoulli } from './hdc_utils/probability';
import { Riemann } from "../riemann/riemann";
import tqdm from "ntqdm";

export class HdcCiMRetrainBase extends HdcCiMBase {
    _retrainTimetensors;

    /**
     * 
     * @param {SETTINGS} settings 
     * @param {Riemann} riemann 
     */
    constructor(settings, riemann) {
        super(settings, riemann);
        if (new.target === HdcCiMRetrainBase) { throw new TypeError("Cannot construct Abstract instances directly"); }
        if (this._retrainAM === undefined) { throw new TypeError("_retrainAM method must be implemented"); }
        if (this._genAMOnlineHD === undefined) { throw new TypeError("_genAMOnlineHD method must be implemented"); }

        this._retrainKernel = riemann.RiemannKernel();
        this._retrainTimetensors = [];
    }

    /**
     * Fits the model to the collected trials
     * @param {boolean} emitTrainingAccuracy - whether to emit accuracy on training set
     */
    async fit(emitTrainingAccuracy = true, initLr=1, retrain=true, retrainingIts = 20, retrainingLr=0.2) {
        const trainBuffer_ = this._riemann.ArrayBuffer();
        this._riemannKernel.fitTrials(trainBuffer_);

        const trainingSet = this._encodeBatch(trainBuffer_, this._nTrials);
        this._AM = this._genAM(trainingSet, this._trialLabels, initLr, retrain, retrainingIts, retrainingLr);

        var acc = null;
        if (emitTrainingAccuracy) { acc = this._predictBatch(trainingSet, this._trialLabels, this._AM); }
        trainingSet.dispose();
        this._resetTrialMetaData();
        return acc;
    }

    async fitEmitBatch(initLr=1, retrain=true, retrainingIts = 20, retrainingLr=0.2) {
        const trainBuffer_ = this._riemann.ArrayBuffer();
        this._riemannKernel.fitTrials(trainBuffer_);

        const trainingSet = this._encodeBatch(trainBuffer_, this._nTrials);
        this._AM = this._genAM(trainingSet, this._trialLabels, initLr, retrain, retrainingIts, retrainingLr);
        
        this._resetTrialMetaData();
        return trainingSet;
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

    /**
     * Adds a training trial
     * @param {Timetensor_d} timetensor 
     */
    collectRetrainTrial(timetensor, label, break_) {
        // this._riemannKernel.addBreak(timetensor);
        // if (break_) { this._riemannKernel.addBreak(break_); }
        this._retrainTimetensors.push(timetensor);
        this._nTrials += 1;
        this._trialLabels.push(label);
    }

    async retrain(iterations, lr) {
        // this._riemannKernel.fitBreaks();

        const trainingSet = tf.tidy(() => {
            const batch = []
            for (const timetensor of this._retrainTimetensors) {
                const buffer_cpp = this._riemann.ArrayBuffer();
                this._riemannKernel.apply(timetensor, buffer_cpp);
                const trial = this._encodeBatch(buffer_cpp, 1);
                batch.push(trial);
            }
            return tf.concat(batch);
        });

        const accBefore = this._predictBatch(trainingSet, this._trialLabels, this._AM);
        console.log("accuracy on training set before retraining: " + accBefore);

        var acc = -1;
        this._AM = tf.tidy(() => {
            this._AM = this._retrainAM(trainingSet, this._trialLabels, this._AM, lr, iterations);
            acc = this._predictBatch(trainingSet, this._trialLabels, this._AM);
            console.log("accuracy on training set after retraining: " + acc);
            return this._AM;
        });
        this._resetTrialMetaData();
        return acc;
    }



    _resetTrialMetaData() {
        this._nTrials = 0;
        this._trialLabels = [];
        this._retrainTimetensors = [];
    }
}