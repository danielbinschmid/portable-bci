import * as tf from '@tensorflow/tfjs';
import jsonfile from "./model.json";
import {Blob} from 'buffer';

export class DeepConvNet {
    constructor() {
        
    }

    async init() {
        // var jsonse = JSON.stringify(jsonfile);
        // var blob = new Blob([jsonse], {type: "application/json"});
        // const model = await tf.loadLayersModel(tf.io.browserFiles([blob]))
        const model = await tf.loadLayersModel("file://tools/deepconvnet/model.json")
        this._model = model;
    }

    async warmUpPrediction() {
        const tensor = tf.zeros([1, 4, 256])

        var t = Date.now()
        const prediction = await this._model.predict(tensor).data();
        var t = Date.now() - t;
        console.log("took time: ")
        console.log(t)
        console.log(prediction)
        return t
    }

    
}

export async function tryy() {
    console.log(jsonfile)

    var jsonse = JSON.stringify(jsonfile);
    var blob = new Blob([jsonse], {type: "application/json"});
    // console.log(blob)

    const model = await tf.loadLayersModel(tf.io.browserFiles([blob]))
    
}