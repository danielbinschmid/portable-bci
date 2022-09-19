import { HdcCnnAddonfHrr} from "../../../tools/hdc/HdcCnnAddon"
import { EEGNet } from "../../../tools/eegnet/load"
import * as tf from "@tensorflow/tfjs"
export async function benchmarkEEGNetHDC(nFinetuneTrials) {
    const eegnet = new EEGNet();
    await eegnet.init();

    const trainBatch = tf.zeros([nFinetuneTrials, 4, 512, 1]);
    const labels = []
    for (var i = 0; i < nFinetuneTrials; i++) { labels.push(i % 3); }

    const hdc = new HdcCnnAddonfHrr(10000, [16, 16], 101)
    const model = eegnet._model

    
    const reducedModel = tf.model({ inputs: model.input, outputs: model.layers[model.layers.length - 4].output })
    const runtimes = {}
    console.log("start hdc-eegnet")
    var now = Date.now()
    const trainBatch_ = reducedModel.predictOnBatch(trainBatch)
    runtimes["eegnet"] = Date.now() - now;
    now = Date.now()
    await hdc.fit(trainBatch_, labels, false);
    runtimes["hdc"] = Date.now() - now;

    console.log(runtimes)

    return runtimes
}