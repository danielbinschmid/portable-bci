import { HdcCiMHrr } from "./hdcCiMHrr";
import * as tf from "@tensorflow/tfjs-node-gpu"
import { arange, isBelowPercentileVector } from "../../evaluation/data_utils/array_utils";
import { DimensionRankingBase } from "./DimensionRankingBase";

export var AMsData = {
    /** @type {tf.Tensor2D[]} */
    AMs: null,
    /** @type {tf.Tensor1D[]} */
    importanceVecs: null
}

export class DimensionRankingfHrr extends DimensionRankingBase {

    /**
     * 
     * @param {HdcCiMHrr} hdc 
     */
    constructor(hdc) {
        super(hdc);
    }

    /**
     * 
     * @param {tf.Tensor2D} AM 
     * @param {tf.Tensor2D} batch 
     * @param {Number[]} labels
     */
    genRankingVec(AM, batch, labels) {
        const rankingVec = tf.tidy(() => {
            const AMVecs = AM.unstack();
            const trials = batch.unstack();
            var rankingVec = tf.zeros([this._hdc._hdDim]);
            for (const trialIdx of arange(0, trials.length)) {
                const trial = trials[trialIdx];
                var trialRanking = tf.zeros([this._hdc._hdDim]);
                for (const labelIdx of arange(0, AMVecs.length)) {
                    const AMVec = AMVecs[labelIdx];
                    const sim = tf.cos(AMVec.sub(trial));
                    if (labelIdx == labels[trialIdx]) { 
                        trialRanking = trialRanking.add(sim)
                    } else {
                       trialRanking = trialRanking.sub(sim.div(tf.scalar(AMVecs.length - 1))); // AMVecs.length - 1
                    }
                }
                rankingVec = rankingVec.add(trialRanking);
            }
            return rankingVec;
        });
        return rankingVec;
    }    
}