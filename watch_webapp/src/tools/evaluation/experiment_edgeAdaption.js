import { EEGNet } from "../eegnet/load";
import { arange } from "./data_utils/array_utils";
import * as tf from "@tensorflow/tfjs"
// import { ModelFitArgs, ModelCompileArgs } from '@tensorflow/tfjs';

export async function runExperiment() {
    const model = new EEGNet();
    await model.init();

    
    /** @type {ModelFitArgs} */
    const fitSettings = {batchSize: 32, epochs: 12, verbose: 0}
    /** @type {ModelCompileArgs} */
    const compileArgs = {loss: 'categoricalCrossentropy', optimizer: 'adam', metrics: 'accuracy'}
    

    model._model.compile(compileArgs);

    const configNFinetuneTrials = [200]
    const runtimes = {}
    for (const nFinetuneTrials of configNFinetuneTrials) {
        const trainBatch = tf.zeros([nFinetuneTrials, 4, 512, 1]);
        var y = []
        for (const x of arange(0, nFinetuneTrials)) { 
            const m = [0, 0, 0]
            m[x % 3] = 1
            y.push(m); 
        }
        y = tf.tensor2d(y)
        var now = Date.now();
        await model._model.fit(trainBatch, y, fitSettings);
        const finetuneTime = Date.now() - now;
        runtimes[nFinetuneTrials] = finetuneTime;

        console.log("for " + nFinetuneTrials +" trials, finetuning took " + finetuneTime + " ms.") 
    }

    console.log(runtimes);

    
    return runtimes
}