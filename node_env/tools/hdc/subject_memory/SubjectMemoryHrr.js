import * as tf from '@tensorflow/tfjs-node-gpu';
import { Riemann } from "../../riemann/riemann";
import { HdcCiMHrr } from "../hdcCiMHrr"
import { arange, maxIdx, shuffle } from '../../../evaluation/data_utils/array_utils';

export class SubjectMemoryHrr {
    /** @type {Riemann} */
    _wasmBackend;
    /** @type {import("../types/hdc").SubjectMemoryEntry[]} Subject memory. Subject tensors of shape (nClasses, hdDim) */
    _subjMemory;
    /** @type {HdcCiMHrr} */
    _hdc;
    _storedTrials;
    _nStore;
    _subjectIds;

    /**
     * 
     * @param {Riemann} wasmBackend 
     * @param {HdcCiMHrr} hdc 
     */
    constructor(wasmBackend, hdc) {
        this._wasmBackend = wasmBackend;
        this._hdc = hdc;
        this._subjMemory = [];
        this._storedTrials = {};
        this._nStore = 60;
        this._subjectIds = []
    }

    /**
     * 
     * @param {Timetensor_d[]} subjectData 
     * @param {number[]} labels 
     * @param {String} id
     */
    genSubjectMemory(subjectData, labels, id) {
        if (id === undefined || id === null) { throw new Error("id must be provided"); }
        if (subjectData.length != labels.length) { throw new Error("labels must have same size as subjectData") }
        const nTrials = subjectData.length;
        const kernel = this._wasmBackend.RiemannKernel();
        const labels_ = []
        kernel.setMeanMetric(this._wasmBackend.EMetric.Euclidian);
        for (const trialIdx of arange(0, nTrials)) {
            const trialTimetensor = subjectData[trialIdx].trial;
            const label = labels[trialIdx] - 1;
            labels_.push(label);
            kernel.addTrial(trialTimetensor);
        }

        const buffer_cpp = this._wasmBackend.ArrayBuffer();
        kernel.fitTrials(buffer_cpp);
        const batch = this._hdc._encodeBatch(buffer_cpp, nTrials);

        const AM = this._hdc._genAM(batch, labels_);

        const acc = this._hdc._predictBatch(batch, labels_, AM);
        console.log(acc + " accuracy on subject memory training data");
        this._subjMemory.push({
            id: id,
            entry: AM
        });

        this._storeTopTrials(batch, labels_, AM, this._nStore, id)
        kernel.reset(); // TODO: destroy kernel;
        this._subjectIds.push(id);
    }

    /**
     * 
     * @param {tf.Tensor2D} subjectData 
     * @param {tf.Tensor2D} AM 
     * @param {number} nStore 
     */
    _storeTopTrials(subjectData, labels, AM, nStore, id) {
        const setByLabel = this._hdc._sortSetForLabels(subjectData, labels);
        const trials = subjectData.unstack();
        const AMVecs = AM.unstack();
        this._storedTrials[id] = {}
        for (const label of arange(0, AMVecs.length)) {
            
            const AMVec = AMVecs[label];
            const trials = setByLabel[label].trials.unstack();
            if (setByLabel[label].label != label) { throw new Error("label mismatch"); }

            var ranking = []
            for (const trialIdx of arange(0, trials.length)) {
                var weight = 0
                const sim = this._hdc._cosSimilarity(trials[trialIdx], AMVec).arraySync();
                for (const opponentLabel of arange(0, AMVecs.length)) {
                    if (opponentLabel != label)
                    {
                        weight += sim - this._hdc._cosSimilarity(trials[trialIdx], AMVecs[opponentLabel]).arraySync();
                    }
                }
                ranking.push([trialIdx, weight]);
            }


            ranking = ranking.sort((a, b) => {return a[1] - b[1]; })
            this._storedTrials[id]["label_" + label] = []
            for (const i in arange(0, Math.floor(nStore / AMVecs.length))) {
                const [trialIdx, weight] = ranking[ranking.length - 1 - i]
                this._storedTrials[id]["label_" + label].push(trials[trialIdx]);
            }
        }

            
        

    }

    /**
     * 
     * @param {number} nTrials 
     * @returns {(tf.Tensor2D | number[])[]}
     */
    getTopTrials(nTrials) {
        const nTrialsSubj = Math.floor(nTrials / this._subjectIds.length);
        const trials = [];
        const labels = []
        for (const subjectId of this._subjectIds) {
            const nTrialsLabel = Math.floor(nTrialsSubj / this._hdc._classLabels.length);
            for (const label of this._hdc._classLabels) {
                for (const i of arange(0, nTrialsLabel)) {
                    trials.push(this._storedTrials[subjectId]["label_" + label][i]);
                    labels.push(label);
                }
            }
        }
        return [tf.stack(trials), labels]
    }

    query(trial, verbose=false) {
        const predictions = [0, 0, 0];
        const subjectPredictions = []
        for (const subjAMEntry of this._subjMemory) {
            const subjAM = subjAMEntry.entry;
            const probs = this._hdc._queryAM(trial, subjAM).arraySync();
            for (const c in this._hdc._classLabels) {
                predictions[c] += probs[c];
            }
            subjectPredictions.push(probs);
        }
        if (verbose) {
            return subjectPredictions;
        } else {
            return predictions;
        }
        
    }

    computeRefWeights(trainingSet, labels, priorizeFactor) {

    }



    /**
     * 
     * @param {tf.Tensor2D} trainingSet 
     * @returns {import('../types/hdc').SubjectMemoryQuery}
     */
    genRefAM(trainingSet, labels, nTrialsTrainingMix, priorizeFactor=1) {
        // sort/cluster trials by label
        const classes = this._hdc._sortSetForLabels(trainingSet, labels);

        const similarities = this._querySubjectMemoryAMs(classes);

        const labelRefs = []
        for (const label of arange(0, similarities.length)) {
            const labelRefVecs = []
            for (const similarity of similarities[label]) {
                const avgProbs = [...similarity.avgProbs[label]] 
                avgProbs[label] = avgProbs[label] * priorizeFactor;
                labelRefVecs.push({
                    label: maxIdx(avgProbs),
                    confidence: avgProbs[label],
                    subjMem: similarity.subjMem
                })
            }
            labelRefs.push(labelRefVecs);
        }

        var minSim = 1;
        var maxSim = -1;
        for (const labelRef of labelRefs) {
            for (const similarity of labelRef) {
                if (similarity.confidence < minSim) { minSim = similarity.confidence; }
                if (similarity.confidence > maxSim) { maxSim = similarity.confidence; }
            }
        }

        // compute ref AM
        const refAM = tf.tidy(() => {
            const refAM = []
            for (const label of arange(0, labelRefs.length)) {
                var tensor = tf.zeros([this._hdc._hdDim]);

                for (const similarity of labelRefs[label]) {
                    const factor = ((similarity.confidence - minSim) * (maxSim - minSim) * (1 / labelRefs[label].length)) ** 2;
                    const AM = similarity.subjMem.entry.unstack();
                    tensor = tensor.add(AM[similarity.label].mul(tf.scalar(factor)));
                }
                tensor = tensor.div(this._hdc._vecLength(tensor, 0));
                refAM.push(tensor);
            }
            return tf.stack(refAM);
        });

        /**
         * 
         
        for (const label of arange(0, labelRefs.length)) {
            const weights = [];
            var normalization = 0;
            for (const similarity of labelRefs[label]) {
                const factor = ((similarity.confidence - minSim) * (maxSim - minSim) * (1 / labelRefs[label].length)) ** 2;
                weights.push(factor);
                normalization += factor;
            }

            for (const similarity of labelRefs[label]) {
                var factor = ((similarity.confidence - minSim) * (maxSim - minSim) * (1 / labelRefs[label].length)) ** 2;
                factor = factor / normalization;
                const nMix = Math.floor(factor * nTrialsTrainingMix);
                const indeces = arange(0, nMix);
                shuffle(indeces);
            }
        }
        */

        return {
            referenceAM: refAM
        }
    }

    /**
     * Queries subject memory AMs
     * @param {import('../types/hdc').LabelSortedTrainingset} classes 
     * @returns {any[][]}
     */
    _querySubjectMemoryAMs(classes) {
        const similarities = []
        
        for (const classData of classes) {
            const trainingTrials = classData.trials.unstack();
            const label = classData.label;
            similarities.push([])

            for (const subjMemEntry of this._subjMemory) {
                const subjectAM = subjMemEntry.entry;
                const avgProbs = [];

                for (const i of arange(0, this._hdc._classLabels.length)) { avgProbs.push(0); }
                for (const trainingTrial of trainingTrials) {
                    const probs = this._queryAM(trainingTrial, subjAM).arraySync();
                    for (const i of arange(0, this._hdc._classLabels.length)) { avgProbs[i] += probs[i]; }
                }
                for (const i of arange(0, this._hdc._classLabels.length)) { avgProbs[i] = avgProbs[i] / trainingTrials.length; }

                const result = {
                    avgProbs: avgProbs,
                    subjMem: subjMemEntry
                }
                similarities[label].push(result);
            }
        }
        return similarities;
    }
}