/**
 * Experiment for the 'immediate use' usability case. 
 * 
 * First, EEGNet is pretrained on a subject database. Second, the user records labelled training 
 * trials and then immediately uses the finetuned network after online finetuning.
 */

import * as tf from '@tensorflow/tfjs';
import { HdcCnnAddonfHrr } from '../../../tools/hdc/HdcCnnAddon';
import { arange, maxIdx, balancedShuffle } from '../../data_utils/array_utils';
import { saveAsJSON } from '../../data_utils/save_benchmarks';
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

function split(X, labels, perc) {
    const shuffledIndeces = balancedShuffle(labels, [0, 1, 2])
    const X_train = []
    const train_lab = []
    const X_test = []
    const test_lab = []
    for (const i of arange(0, Math.floor(perc * X.length))) {
        X_train.push(X[shuffledIndeces[i]])
        train_lab.push(labels[shuffledIndeces[i]])
    }
    for (const i of arange(Math.floor(perc * X.length), shuffledIndeces.length)) {
        X_test.push(X[shuffledIndeces[i]])
        test_lab.push(labels[shuffledIndeces[i]])
    }
    return [tf.stack(X_train), train_lab, tf.stack(X_test), test_lab]
}


export async function evaluate() {
    const globPath = "/mnt/d/bachelor-thesis/git/portable-bci/"
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const runs = arange(0, 10)
    for (const i of runs) {
        runs[i] = "run_" + i;
    }

    const percs = [0.05, 0.1, 0.15, 0.2, 0.5]

    var avgs = {};
    for (const perc of percs) {
        avgs[perc] = 0;
    }
    const accs = {}

    var runIdx = 0
    for (const run of runs) {
        runIdx += 1;
        accs[run] = {}
        var percIdx = 0;
        for (const perc of percs) {
            percIdx += 1
            accs[run][perc] = {}
            
            for (const session of ["train", "test"]) {
                accs[run][perc][session] = {}
                for (const subject of subjects) {
                    console.log("&&&&&& subject " + subject + "&&&&&&&");
                    const datafolder = "file://" + globPath +"node_env/evaluation/data/eegnet_experiment/hdcaddon/"

                    const data = require("/mnt"+ globPath +"node_env/evaluation/data/eegnet_experiment/hdcaddon/" + subject + "/subj_data.json")
                    const train_data = data[session + "_data"]

                    const nChannels = train_data[0].length;
                    const nSamples = train_data[0][0].length

                    const test_data = data[session + "_data"]

                    const nTestTrials = test_data.length;

                    const test_batch = tf.tensor3d(test_data, [nTestTrials, nChannels, nSamples]).reshape([nTestTrials, nChannels, nSamples, 1]);
                    const testsession_labels = data[session + "_labels"]

                    accs[run][perc][session][subject] = {}
                    const model = await tf.loadLayersModel(datafolder + subject + "/pretrained/model.json")



                    const newmodel = tf.model({ inputs: model.input, outputs: model.layers[model.layers.length - 4].output })
                    const hdc = new HdcCnnAddonfHrr(10000, [16, 16], 101);
                    const X_testsession = newmodel.predictOnBatch(test_batch);
                    const [X_finetune, finetune_labels, X_test, test_labels] = split(X_testsession.unstack(), testsession_labels, perc);


                    await hdc.fit(X_finetune, finetune_labels, true, .1, 2)

                    accs[run][perc][session][subject]["testAcc"] = getacc(await hdc.predictOnBatch(X_test), test_labels, "testAccOnlyNewData")

                    avgs[perc] += accs[run][perc][session][subject]["testAcc"] * (1 / subjects.length)
                }


            }
            console.log(accs);

            console.log("avg after perc " + perc + ": " + avgs[perc] / (runIdx * 2));

            saveAsJSON(accs, "cnnhdc_immediateUse" + run + perc, "./evaluation/benchmarks/")
        }
        
    }

    


}

export default evaluate;