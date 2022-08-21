import * as tf from '@tensorflow/tfjs';
import jsonfile from "./model.json";
import { ModelFitArgs, ModelCompileArgs } from '@tensorflow/tfjs';
import { arange } from "@/tools/evaluation/data_utils/array_utils";

export class EEGNet {
    /** @type {tf.LayersModel} */
    _model;
    constructor() {
        
    }

    async init() {
        var jsonse = JSON.stringify(jsonfile);
        var blob = new Blob([jsonse], {type: "application/json"});
        const model = await tf.loadLayersModel(tf.io.browserFiles([blob]))

        this._model = model;
        return this;
    }

    async warmUpPrediction() {
        const tensor = tf.zeros([1, 4, 512, 1])

        var t = Date.now()
        const prediction = await this._model.predict(tensor).data();
        var t = Date.now() - t;
        console.log("took time: ")
        console.log(t)
        console.log(prediction)
        return t
    }

    async prediction(timeseries) {
        const tensor = tf.tensor2d(timeseries).reshape([1, timeseries.length, timeseries[0].length, 1]);
        const prediction = await this._model.predict(tensor).data();
        return prediction;
    }

    /**
     * 
     * @param {number[][][]} trials of shape (nTrials, nChannels, nSteps) 
     * @param {number[]} labels
     */
    uploadAsBatch(trials, labels) {
        const X = tf.tensor3d(trials).reshape([trials.length, trials[0].length, trials[0][0].length, 1]);
        const y = []
        for (const label of labels) {
            const m = [0, 0, 0]
            m[label] = 1
            y.push(m); 
        }
        const Y = tf.tensor2d(y)
        return [X, Y];
    }

    /**
     * 
     * @param {number} nTrials 
     */
    async genDummyTrainingBatch(nTrials) {
        const trainBatch = tf.zeros([nTrials, 4, 512, 1]);
        var y = []
        for (const x of arange(0, nTrials)) { 
            const m = [0, 0, 0]
            m[x % 3] = 1
            y.push(m); 
        }
        y = tf.tensor2d(y)
        return [trainBatch, y]
    }
    
    /**
     * * List of callbacks to be called during training.
     * Can have one or more of the following callbacks:
     *   - `onTrainBegin(logs)`: called when training starts.
     *   - `onTrainEnd(logs)`: called when training ends.
     *   - `onEpochBegin(epoch, logs)`: called at the start of every epoch.
     *   - `onEpochEnd(epoch, logs)`: called at the end of every epoch.
     *   - `onBatchBegin(batch, logs)`: called at the start of every batch.
     *   - `onBatchEnd(batch, logs)`: called at the end of every batch.
     *   - `onYield(epoch, batch, logs)`: called every `yieldEvery` milliseconds
     *      with the current epoch, batch and logs. The logs are the same
     *      as in `onBatchEnd()`. Note that `onYield` can skip batches or
     *      epochs. See also docs for `yieldEvery` below.
     * 
     * @param {tf.Tensor4D} X 
     * @param {tf.Tensor2D} Y 
     * @returns 
     */
    async finetune(X, Y, nEpochs, onTrainBegin, onTrainEnd, onEpoch) { 

        /** @type {ModelFitArgs} */
        const fitSettings = {batchSize: 32, epochs: nEpochs, verbose: 0, callbacks: {
            onTrainBegin: onTrainBegin,
            onTrainEnd: onTrainEnd,
            onEpochBegin: onEpoch
        }}
        /** @type {ModelCompileArgs} */
        const compileArgs = {loss: 'categoricalCrossentropy', optimizer: 'adam', metrics: 'accuracy'}
        
        this._model.compile(compileArgs);

        await this._model.fit(X, Y, fitSettings);
        return tf.getBackend()
    }
    
}

export async function tryy() {


    var jsonse = JSON.stringify(jsonfile);
    var blob = new Blob([jsonse], {type: "application/json"});


    const model = await tf.loadLayersModel(tf.io.browserFiles([blob]))
    
}
// tf.io.browserFiles()