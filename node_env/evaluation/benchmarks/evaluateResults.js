
import {arange} from "../data_utils/array_utils";
const jsobj = require("./meanMetricAccuracies_15_06.json");
const crossSessionMeanMetricAccuraciesJson = require("./noTransfer_17_06.json");
const transferBaselineJson = require("./transferBaseline_1655480615422.json");
const transferEuclJson = require("./transferEucl_17_06.json");
const riemannCiM = require("./hdcRiemannCiM_1656326660212.json")
const hrrRetrainJson = require("./hdcHRR_retrain-it-20_lr-0-2_init-lr-1.json")
// const noCostMeansJSON = require("./noCostMeans_1655384591067.json"); transferBaseline_1655473784778

export function meanMetricAccuracies()
{       
    const test_runs = [0, 1, 2]
    const test_run_prefix = "test_run_" ;
    const subjects = arange(1, 10);
    const subject_prefix = "subj_";
    const metrics = [
        "ALE",
        "Riemann",
        "Euclidian",
        "LogEuclidian",
        "LogDet",
        "Kullback",
        "Harmonic",
        "Wasserstein",
        "Identity"
    ]
    const mode_ = "no-adaption";
    const folds = [1, 2, 3];
    const fold_prefix = "fold_";
    
    const accuracies = {}

    for (const metric of metrics) {
        accuracies[metric] = 0;
    }

    for (const test_run of test_runs) {
        for (const subject of subjects) {
            for (const metric of metrics) {
                for (const fold of folds) {

                    const test_id = test_run_prefix + test_run.toString();
                    const subj_id = subject_prefix+ subject.toString();
                    const fold_id = fold_prefix + fold.toString();
                    const acc = jsobj[test_id][subj_id][metric][mode_][fold_id];
                    
                    accuracies[metric] += acc;

                }
            }
            
        }
    }

    for (const metric of metrics) {
        accuracies[metric] = accuracies[metric] / (test_runs.length * folds.length * subjects.length);
    }

    console.log(accuracies);

}

export function crossSessionMeanMetricAccuracies() 
{
    const test_runs = [0, 1, 2, 3, 4]
    const test_run_prefix = "test_run_" ;
    const subjects = arange(1, 10);
    const subject_prefix = "subj_";
    const metrics = [
        "ALE",
        "Riemann",
        "Euclidian",
        "LogEuclidian",
        "LogDet",
        "Kullback",
        "Harmonic",
        "Wasserstein",
        "Identity"
    ]
    const transferMeanMetricPrefix = "transfer_mean_metric_"
    const trainingMeanMetricPrefix = "training_mean_metric_"
    const mode_ = "no-transfer";
    const fold_ = "fold_1";
    const switches = ["switch_true", "switch_false"];


    const accuracies = {}
    for (const metric of metrics) {
        accuracies[metric] = 0;
    }

    for (const test_run of test_runs)
    {
        for (const subject of subjects) 
        {
            for (const metric of metrics) 
            {
                for (const switch_ of switches)
                {
                    const test_id = test_run_prefix + test_run;
                    const subj_id = subject_prefix + subject;
                    const transferMetricID = transferMeanMetricPrefix + metric;
                    const trainingMetricID = trainingMeanMetricPrefix + metric;
                    
                    const acc = crossSessionMeanMetricAccuraciesJson[test_id][subj_id][transferMetricID][trainingMetricID][mode_][fold_][switch_];
                    accuracies[metric] += acc;
                }
            }
        }
    }

    for (const metric of metrics) {
        accuracies[metric] = accuracies[metric] / (subjects.length * test_runs.length * switches.length);
    }

    console.log(accuracies);
    
}



export function transferBaselineAccs() 
{
    const test_runs = [0]
    const test_run_prefix = "test_run_" ;
    const subjects = arange(1, 10);
    const subject_prefix = "subj_";
    const metrics = [
        "ALE",
        "Riemann",
        "Euclidian",
        "LogEuclidian",
        "LogDet",
        "Kullback",
        "Harmonic",
        "Wasserstein",
        "Identity"
    ]
    const transferMeanMetricPrefix = "transfer_mean_metric_"
    const trainingMeanMetricPrefix = "training_mean_metric_"
    const mode_ = "transfer-baseline";
    const fold_ = "fold_1";
    const switches = ["switch_true", "switch_false"];


    const accuracies = {}
    for (const metric of metrics) {
        accuracies[metric] = 0;
    }

    for (const test_run of test_runs)
    {
        for (const subject of subjects) 
        {
            for (const metric of metrics) 
            {
                for (const switch_ of switches)
                {
                    const test_id = test_run_prefix + test_run;
                    const subj_id = subject_prefix + subject;
                    const transferMetricID = transferMeanMetricPrefix + metric;
                    const trainingMetricID = trainingMeanMetricPrefix + metric;
                    
                    const acc = transferBaselineJson[test_id][subj_id][transferMetricID][trainingMetricID][mode_][fold_][switch_];
                    accuracies[metric] += acc;
                }
            }
        }
    }

    for (const metric of metrics) {
        accuracies[metric] = accuracies[metric] / (subjects.length * test_runs.length * switches.length);
    }

    console.log(accuracies);
}

export function transferEuclAccs()
{
    const test_runs = arange(0,5);
    const test_run_prefix = "test_run_" ;
    const subjects = arange(2, 7);
    const subject_prefix = "subj_";
    const metrics = [
        "Euclidian"
    ]
    const transferMeanMetricPrefix = "transfer_mean_metric_"
    const trainingMeanMetricPrefix = "training_mean_metric_"
    const mode_ = "transfer";
    const fold_ = "fold_1";
    const switches = ["switch_true", "switch_false"];


    const accuracies = {}
    for (const metric of metrics) {
        accuracies[metric] = 0;
    }

    for (const test_run of test_runs)
    {
        for (const subject of subjects) 
        {
            for (const metric of metrics) 
            {
                for (const switch_ of switches)
                {
                    const test_id = test_run_prefix + test_run;
                    const subj_id = subject_prefix + subject;
                    const transferMetricID = transferMeanMetricPrefix + metric;
                    const trainingMetricID = trainingMeanMetricPrefix + metric;
                    const acc = transferEuclJson[test_id][subj_id][transferMetricID][trainingMetricID][mode_][fold_][switch_];
                    accuracies[metric] += acc;
                }
            }
        }
    }

    for (const metric of metrics) {
        accuracies[metric] = accuracies[metric] / (subjects.length * test_runs.length * switches.length);
    }

    console.log(accuracies);
}

export function riemannCiMAccs() {
    const test_runs = arange(0,10);
    const test_run_prefix = "run_" ;
    const subjects = arange(1, 10);
    const subject_prefix = "subj_";
    const switches = ["isReversed_false", "isReversed_true"];


    const accuracies = {}
    for (const subj of subjects) {
        accuracies[subj] = 0;
    }

    for (const test_run of test_runs)
    {
        for (const subject of subjects) 
        {
            for (const switch_ of switches)
            {
                const test_id = test_run_prefix + test_run;
                const subj_id = subject_prefix + subject;
                const acc = riemannCiM[test_id][subj_id][switch_];
                accuracies[subject] += acc;
            }
        }
    }

    var avg = 0;
    for (const subj of subjects) {
        accuracies[subj] = accuracies[subj] / (test_runs.length * switches.length);
        avg += accuracies[subj];
    }

    console.log(accuracies);

    console.log("average: " + (avg / subjects.length))
}

export function hrrRetrainAcc() {
    const test_runs = arange(0,2);
    const test_run_prefix = "run_";
    const subjects = arange(1, 10);
    const subject_prefix = "subj_";
    const switches = ["isReversed_false", "isReversed_true"];


    const accuracies = {}
    for (const subj of subjects) {
        accuracies[subj] = 0;
    }

    for (const test_run of test_runs)
    {
        for (const subject of subjects) 
        {
            for (const switch_ of switches)
            {
                const test_id = test_run_prefix + test_run;
                const subj_id = subject_prefix + subject;
                const acc = hrrRetrainJson[test_id][subj_id][switch_];
                accuracies[subject] += acc;
            }
        }
    }

    var avg = 0;
    for (const subj of subjects) {
        accuracies[subj] = accuracies[subj] / (test_runs.length * switches.length);
        avg += accuracies[subj];
    }

    console.log(accuracies);

    console.log("average: " + (avg / subjects.length))
}


export function crossSubjectDataAugmentedRetrainingAccs() {
    const d1 = require("./crossSubjectDataAugmentedRetraining_1656690902742.json");
    const runPrefix = "run_"
    const runs = arange(0, 10)

    const modes = ["isReversed_false", "isReversed_true"]

    const subjPrefix = "subj_"
    const subjects = arange(1, 10)
    
    const valId = "subjIndiv" // "subjIndiv"

    const subjectAccs = {}
    for (const subject of subjects) {
        subjectAccs[subject] = 0;
    }

    var i = 0
    for (const run of runs) {
        for (const mode of modes) {
            i += 1;
            for (const subj of subjects) {
                const acc = d1[runPrefix + run][mode][subjPrefix + subj][valId]
                subjectAccs[subj] += acc;
            }
        }
    }
    
    var avg = 0
    for (const subject of subjects) {
        subjectAccs[subject] = subjectAccs[subject] / i;
        avg += subjectAccs[subject]
    }
    console.log(subjectAccs);
    console.log("avg acc: " + avg / subjects.length);


}