/**
 * Cross session evaluation with partial training sets. 
 */

import * as tf from '@tensorflow/tfjs';
import { HdcCnnAddonfHrr } from '../../tools/hdc/HdcCnnAddon';
import { arange, maxIdx, balancedShuffle } from '../data_utils/array_utils';
import { ModelFitArgs, ModelCompileArgs } from "@tensorflow/tfjs-node-gpu"
import { saveAsJSON } from '../data_utils/save_benchmarks';
function getacc(probs, labels, id) {
    const nTrainTrials = probs.length;

    var nCorrects = 0;
    for (const trialIdx of arange(0, nTrainTrials)) {
        const prob = probs[trialIdx]
        const pred = maxIdx(prob);
        // console.log(pred)
        // console.log(train_labels[trialIdx])
        nCorrects += pred == labels[trialIdx]
    }
    console.log(id + " " + nCorrects / nTrainTrials);
    return nCorrects / nTrainTrials
}

function split(X, labels, nCalibr) {
    const X_train = []
    const train_lab = []
    const X_test = []
    const test_lab = []
    for (const i of arange(0, nCalibr)) {
        X_train.push(X[i])
        train_lab.push(labels[i])
    }
    for (const i of arange(nCalibr, labels.length)) {
        X_test.push(X[i])
        test_lab.push(labels[i])
    }
    return [tf.stack(X_train), train_lab, tf.stack(X_test), test_lab]
}

function prepareNNFinetune(test_data, test_labels, perc) {
    const shuffledIndeces = balancedShuffle(test_labels, [0, 1, 2]);
    const nTrainTrials = Math.floor(perc * shuffledIndeces.length);

    var X = []
    var Y = []
    const Y_or = []
    const nClasses = 3
    for (const i of arange(0, nTrainTrials)) {
        X.push(test_data[shuffledIndeces[i]]);
        Y_or.push(test_labels[shuffledIndeces[i]]);
        const label = []
        for (const c of arange(0, nClasses)) { label.push(c == test_labels[shuffledIndeces[i]]); }
        Y.push(label)
    }

    const nTrials = X.length;
    const nChannels = X[0].length;
    const nSamples = X[0][0].length
    const X_batch = tf.tensor3d(X, [nTrials, nChannels, nSamples]).reshape([nTrials, nChannels, nSamples, 1]);

    return [X_batch, tf.tensor2d(Y), X, Y_or]
}

export async function evaluate() {
    const globPath = "/mnt/d/bachelor-thesis/git/portable-bci/"
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const runs = arange(0, 10)
    for (const i of runs) {
        runs[i] = "run_" + i;
    }

    const percentages = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1]

    var avgs = {};

    const expID = "cnnHDC_partialCrossSession"
    const accs = {}

    var runIdx = 0
    for (const run of runs) {
        runIdx += 1;
        accs[run] = {}
        avgs[run] = {}
        for (const percentage of percentages) {
            avgs[run][percentage] = {}
        }

        for (const percentage of percentages) {
            accs[run][percentage] = {};
            for (const subject of subjects) {
                accs[run][percentage][subject] = {}
                for (const session of [false, true]) {
                    accs[run][percentage][subject][session] = {}
                    const trainsession = session ? "train" : "test";
                    const testsession = session ? "test" : "train";
                    console.log("&&&&&& subject " + subject + "&&&&&&&");
                    const datafolder = "file://" + globPath +"node_env/evaluation/data/eegnet_experiment/hdcaddon/"

                    const data = require("/mnt" +globPath+"node_env/evaluation/data/eegnet_experiment/hdcaddon/" + subject + "/subj_data.json")
                    const train_data = data[trainsession + "_data"]

                    const nChannels = train_data[0].length;
                    const nSamples = train_data[0][0].length;
                    const train_labels = data[trainsession + "_labels"]



                    const model = await tf.loadLayersModel(datafolder + subject + "/pretrained/model.json")

                    const [eegnetX, eegnetY, X_finetune, Y_finetune] = prepareNNFinetune(train_data, train_labels, percentage)

                    /** @type { ModelCompileArgs} */
                    const modelCompileArgs = { loss: "categoricalCrossentropy", optimizer: "adam", metrics: ["accuracy"] }
                    model.compile(modelCompileArgs);

                    /** @type { ModelFitArgs } */
                    const modelfitargs = {
                        batchSize: 32,
                        epochs: 12,
                    }
                    await model.fit(eegnetX, eegnetY, modelfitargs)

                    const newmodel = tf.model({ inputs: model.input, outputs: model.layers[model.layers.length - 4].output })
                    const hdc = new HdcCnnAddonfHrr(10000, [16, 16], 101);

                    const train_batch = tf.tensor3d(X_finetune, [X_finetune.length, nChannels, nSamples]).reshape([X_finetune.length, nChannels, nSamples, 1]);
                    const test_data = data[testsession + "_data"]
                    const nTestTrials = test_data.length;
                    const test_batch = tf.tensor3d(test_data, [nTestTrials, nChannels, nSamples]).reshape([nTestTrials, nChannels, nSamples, 1]);
                    const testsession_labels = data[testsession + "_labels"]

                    const X_trainsession = newmodel.predictOnBatch(train_batch);
                    const X_testsession = newmodel.predictOnBatch(test_batch);

                    await hdc.fit(X_trainsession, Y_finetune, true, .1, 2)

                    accs[run][percentage][subject][session]["testAcc"] = getacc(await hdc.predictOnBatch(X_testsession), testsession_labels, "testAccOnlyNewData")

                    avgs[run][percentage] += accs[run][percentage][subject][session]["testAcc"] * (1 / (subjects.length * 2))
                }
                saveAsJSON(accs, "cache/accs_" + expID)
            }
        }

        console.log(accs);
        console.log(avgs)
    }

    saveAsJSON(accs, "accs_" + expID)

    saveAsJSON(avgs, "avgs_" + expID)


}

export default evaluate;