import * as tf from '@tensorflow/tfjs';
import { HdcCnnAddonfHrr } from '../../tools/hdc/HdcCnnAddon';
import { arange, maxIdx } from '../data_utils/array_utils';

function getacc(probs, labels, id) {
    const nTrainTrials = probs.length;
    
    var nCorrects = 0;
    for (const trialIdx of arange(0, nTrainTrials)) {
        const prob = probs[trialIdx]
        const pred = maxIdx(prob);  
        // console.log(pred)
        // console.log(train_labels[trialIdx])
        nCorrects +=pred == labels[trialIdx] 
    }
    console.log(id + " "+ nCorrects / nTrainTrials);
    return nCorrects / nTrainTrials
}

function split(X, labels, nCalibr) {
    const X_train = []
    const train_lab = []
    const X_test = []
    const test_lab = []
    for (const i of arange(0, nCalibr)){
        X_train.push(X[i])
        train_lab.push(labels[i])
    }
    for (const i of arange(nCalibr, labels.length)) {
        X_test.push(X[i])
        test_lab.push(labels[i])
    }
    return [tf.stack(X_train), train_lab, tf.stack(X_test), test_lab]
}

export async function evaluate() {

    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const runs = arange(0, 10)
    for (const i of runs) {
        runs[i] = "run_" + i;
    }

    var avg = 0;
    var avgRef = 0;
    const accs = {}

    var runIdx=0
    for (const run of runs) {
        runIdx+=1;
        accs[run] = {}
        for (const subject of subjects) 
        {
            console.log("&&&&&& subject "+ subject + "&&&&&&&");
            const datafolder = "file:///mnt/d/bachelor-thesis/git/portable-bci/node_env/evaluation/data/eegnet_experiment/hdcaddon/"

            const data = require("/mnt/d/bachelor-thesis/git/portable-bci/node_env/evaluation/data/eegnet_experiment/hdcaddon/"+subject+"/subj_data.json")
            const train_data = data["train_data"]

            const nTrainTrials = train_data.length;
            const nChannels = train_data[0].length;
            const nSamples = train_data[0][0].length 
            const train_batch = tf.tensor3d(train_data, [nTrainTrials, nChannels, nSamples]).reshape([nTrainTrials, nChannels, nSamples, 1]);
            const train_labels = data["train_labels"]


            const test_data = data["test_data"]

            const nTestTrials = test_data.length;

            const test_batch = tf.tensor3d(test_data, [nTestTrials, nChannels, nSamples]).reshape([nTestTrials, nChannels, nSamples, 1]);
            const testsession_labels = data["test_labels"]

            accs[run][subject] = {}
            const model = await tf.loadLayersModel(datafolder + subject + "/finetuned/model.json") 
            const newmodel = tf.model({inputs: model.input, outputs: model.layers[model.layers.length - 4].output})
            const hdc = new HdcCnnAddonfHrr(10000, [16, 16], 1001);


            const X_train = newmodel.predictOnBatch(train_batch);
            await hdc.fit(X_train, train_labels);
            accs[run][subject]["trainingAcc"] = getacc(await hdc.predictOnBatch(X_train), train_labels, "trainingAcc");

            const X_testsession = newmodel.predictOnBatch(test_batch);
            accs[run][subject]["refAcc"] = getacc(await hdc.predictOnBatch(X_testsession), testsession_labels, "refAcc");

            const [X_finetune, finetune_labels, X_test, test_labels] = split(X_testsession.unstack(), testsession_labels, 50);

            accs[run][subject]["finetuneAccBefore"] = getacc(await hdc.predictOnBatch(X_finetune), finetune_labels, "finetuneAccBefore")
            accs[run][subject]["testAccBefore"] = getacc(await hdc.predictOnBatch(X_test), test_labels, "testAccBefore")

            

            hdc.retrain(X_finetune, finetune_labels, 0.1, 10);
            
            console.log("finished retraining")
            accs[run][subject]["finetuneAcc"] = getacc(await hdc.predictOnBatch(X_finetune), finetune_labels, "finetuneAcc")
            accs[run][subject]["testAcc"] = getacc(await hdc.predictOnBatch(X_test), test_labels, "testAcc")


            await hdc.fit(X_finetune, finetune_labels)

            accs[run][subject]["finetuneAccOnlyNewData"] = getacc(await hdc.predictOnBatch(X_finetune), finetune_labels, "finetuneAccOnlyNewData")
            accs[run][subject]["testAccOnlyNewData"] = getacc(await hdc.predictOnBatch(X_test), test_labels, "testAccOnlyNewData")

            avgRef += accs[run][subject]["testAccBefore"] * (1 / subjects.length)
            avg += accs[run][subject]["testAcc"] * (1 / subjects.length)
            // const X_test = newmodel.predictOnBatch(test_batch);
            // const test_probs = await hdc.predictOnBatch(X_test);
            // getacc(test_probs, testsession_labels)
        }
        console.log(accs);
        console.log("avg ref: " + (avgRef / (runIdx)));
        console.log("avg after: " + avg / (runIdx)); 
    }

    
    
}