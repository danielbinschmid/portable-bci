
import {arange} from "../data_utils/array_utils";




// const noCostMeansJSON = require("./noCostMeans_1655384591067.json"); transferBaseline_1655473784778
const TEST_RUN_ = "test_run_";
const SUBJ_ = "subj_";
const FOLD_ = "fold_";

export function meanMetricAccuracies()
{       
    const jsobj = require("./meanMetricAccuracies_15_06.json");
    const test_runs = [0, 1, 2]
    const subjects = arange(1, 10);
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
    
    const accuracies = {}

    for (const metric of metrics) {
        accuracies[metric] = 0;
    }

    for (const test_run of test_runs) {
        for (const subject of subjects) {
            for (const metric of metrics) {
                for (const fold of folds) {

                    const test_id = TEST_RUN_ + test_run;
                    const subj_id = SUBJ_ + subject;
                    const fold_id = FOLD_ + fold;
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
    const crossSessionMeanMetricAccuraciesJson = require("./noTransfer_17_06.json");
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
    const transferBaselineJson = require("./transferBaseline_1655480615422.json");
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


export function riemannCiMAccs() {
    const riemannCiM = require("./hdcRiemannCiM_1656326660212.json")
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
    const hrrRetrainJson = require("./hdcHRR_retrain-it-20_lr-0-2_init-lr-1.json")
    const test_runs = arange(0,8);
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


export function onlineCrossSessionAdaptionAcc() {
    const d1 = require("./onlineCrossSessionAdaption_12its_0-01lr_1656973842777.json")

    const run_prefix = "run_"
    const subj_prefix = "subj_"
    const proportionPrefix = "proportion_"

    const runs = [0]
    const subjects = [1, 2, 3, 4 ,5]
    const modes = ["isReversed_false", "isReversed_true"]
    const baselineID = "pretrain_ref_acc"
    const proportions = [0.5, 0.2, 0.15, 0.1, 0.05]


    const accs = {}
    for (const subject of subjects) {
        accs[subject] = {}
        accs[subject][baselineID] = 0;
        for (const proportion of proportions) {
            accs[subject][proportionPrefix + proportion] = 0;
        }
    }

    for (const run of runs) {
        for (const subject of subjects) {
            for (const mode of modes) {
                accs[subject][baselineID] += d1[run_prefix + run][subj_prefix + subject][mode][baselineID];
                for (const proportion of proportions) {
                    var li = d1[run_prefix + run][subj_prefix + subject][mode][proportionPrefix + proportion]
                    var a = 0;
                    const l = li.length;
                    for (const e of li) {
                        a += e; 
                    }
                    a = a / l;
                    accs[subject][proportionPrefix + proportion] += a;
                }
            }
        }
    }

    const proportionAvgs = {}
    for (const proportion of proportions) {
        proportionAvgs[proportionPrefix + proportion] = 0
    }
    var baselineAvg = 0;

    for (const subject of subjects) {
        accs[subject][baselineID] = accs[subject][baselineID] / (runs.length * modes.length);
        baselineAvg += accs[subject][baselineID];
        for (const proportion of proportions) { 
            accs[subject][proportionPrefix + proportion] = accs[subject][proportionPrefix + proportion] / (runs.length * modes.length);
            proportionAvgs[proportionPrefix + proportion] += accs[subject][proportionPrefix + proportion];
        }
    }
    console.log(accs);


    for (const proportion of proportions) {
        console.log(proportionPrefix + proportion + ": " + (proportionAvgs[proportionPrefix + proportion] / subjects.length));
    }
    console.log("baseline average: " + baselineAvg / subjects.length);
    

}

export function onlineCrossSessionAdaptionNoRiemannRefChangeAcc() {
    const d1 = require("./onlineCrossSessionAdaption_noRiemannRefChange_12its_0-01lr_1657131637883.json")

    const run_prefix = "run_"
    const subj_prefix = "subj_"
    const proportionPrefix = "proportion_"

    const runs = [0, 1]
    const subjects = arange(1, 10)
    const modes = ["isReversed_false", "isReversed_true"]
    const baselineID = "pretrain_ref_acc"
    const proportions = [0.5, 0.2, 0.15, 0.1, 0.05]


    const accs = {}
    for (const subject of subjects) {
        accs[subject] = {}
        accs[subject][baselineID] = 0;
        for (const proportion of proportions) {
            accs[subject][proportionPrefix + proportion] = 0;
        }
    }

    for (const run of runs) {
        for (const subject of subjects) {
            for (const mode of modes) {
                accs[subject][baselineID] += d1[run_prefix + run][subj_prefix + subject][mode][baselineID];
                for (const proportion of proportions) {
                    var li = d1[run_prefix + run][subj_prefix + subject][mode][proportionPrefix + proportion]
                    var a = 0;
                    const l = li.length;
                    for (const e of li) {
                        a += e; 
                    }
                    a = a / l;
                    accs[subject][proportionPrefix + proportion] += a;
                }
            }
        }
    }

    const proportionAvgs = {}
    for (const proportion of proportions) {
        proportionAvgs[proportionPrefix + proportion] = 0
    }
    var baselineAvg = 0;

    for (const subject of subjects) {
        accs[subject][baselineID] = accs[subject][baselineID] / (runs.length * modes.length);
        baselineAvg += accs[subject][baselineID];
        for (const proportion of proportions) { 
            accs[subject][proportionPrefix + proportion] = accs[subject][proportionPrefix + proportion] / (runs.length * modes.length);
            proportionAvgs[proportionPrefix + proportion] += accs[subject][proportionPrefix + proportion];
        }
    }
    console.log(accs);


    for (const proportion of proportions) {
        console.log(proportionPrefix + proportion + ": " + (proportionAvgs[proportionPrefix + proportion] / subjects.length));
    }
    console.log("baseline average: " + baselineAvg / subjects.length);
    
}

export function onlineCrossSubjectNaive() {
    const d1 = require("./onlineCrossSubjectNaive_1657207245859.json")

    const run_prefix = "run_"
    const subj_prefix = "subj_"
    const proportionPrefix = "proportion_"

    const runs = [0, 1, 2]
    const subjects = arange(1, 10)
    const modes = ["isReversed_false", "isReversed_true"]
    const proportions = [0.5, 0.2, 0.15, 0.1, 0.05]


    const accs = {}
    for (const subject of subjects) {
        accs[subject] = {}
        for (const proportion of proportions) {
            accs[subject][proportionPrefix + proportion] = 0;
        }
    }

    for (const run of runs) {
        for (const subject of subjects) {
            for (const mode of modes) {
                for (const proportion of proportions) {
                    var li = d1[run_prefix + run][subj_prefix + subject][mode][proportionPrefix + proportion]
                    var a = 0;
                    const l = li.length;
                    for (const e of li) {
                        a += e; 
                    }
                    a = a / l;
                    accs[subject][proportionPrefix + proportion] += a;
                }
            }
        }
    }

    const proportionAvgs = {}
    for (const proportion of proportions) {
        proportionAvgs[proportionPrefix + proportion] = 0
    }

    for (const subject of subjects) {
        for (const proportion of proportions) { 
            accs[subject][proportionPrefix + proportion] = accs[subject][proportionPrefix + proportion] / (runs.length * modes.length);
            proportionAvgs[proportionPrefix + proportion] += accs[subject][proportionPrefix + proportion];
        }
    }
    console.log(accs);


    for (const proportion of proportions) {
        console.log(proportionPrefix + proportion + ": " + (proportionAvgs[proportionPrefix + proportion] / subjects.length));
    }
    
}

export function sessionTransferRiemannEuclidianAccs() {
    const d1 = require("./transfer_refChangeWeight-4_1657462371112.json")

    const run_prefix = "run_"
    const runs = arange(0, 10)

    const subj_prefix = "subj_"
    const subjects = arange(1, 10);

    const sessions = ["isReversed_false", "isReversed_true"]

    const ids = ["ref_acc", "adaption_acc", "optimal_riemann_ref", "optimal_riemann_ref_breaks"]

    const accs = {}
    for (const id of ids) {
        accs[id] = 0;
    }

    for (const run of runs) {
        for (const subj of subjects) {
            for (const session of sessions) {
                for (const id of ids) {
                    accs[id] += d1[run_prefix + run][subj_prefix + subj][session][id] / (runs.length * sessions.length * subjects.length);
                }
            }
        }
    }

    console.log(accs);
}

export function crossSubjectAccs() {
    const d1 = require("./dimRankingSubjectTransfer_0.2percentile_1657563068236.json")

    const run_prefix = "run_"
    const runs = arange(0, 10)

    const subj_prefix = "subj_"
    const subjects = arange(1, 10);

    const sessions = ["isReversed_false", "isReversed_true"]

    const percentile_prefix = "percentile_"
    const percentiles = [0.2]

    const ids = ["trainingAccBefore",
        "trainingAccAfter",
        "testAccBefore",
        "testAccAfter",
        "finetunedTestingAcc", 
        "finetunedTrainingAcc"
    ]

    const accs = {}
    for (const id of ids) {
        accs[id] = 0;
    }

    for (const run of runs) {
        for (const subj of subjects) {
            for (const session of sessions) {
                for (const percentile of percentiles)
                for (const id of ids) {
                    accs[id] += d1[run_prefix + run][session][subj_prefix + subj][percentile_prefix + percentile][id] / (runs.length * sessions.length * subjects.length * percentiles.length);
                }
            }
        }
    }

    console.log(accs);

}

export function crossSubjectAccsPercentiles() {
    const d1 = require("./dimRankingSubjectTransfer_perrcentilesGridSearch_1657563416730.json")

    const run_prefix = "run_"
    const runs = arange(0, 8)

    const subj_prefix = "subj_"
    const subjects = arange(1, 10);

    const sessions = ["isReversed_false", "isReversed_true"]

    const percentile_prefix = "percentile_"
    const percentiles = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]

    const ids = ["trainingAccBefore",
        "trainingAccAfter",
        "testAccBefore",
        "testAccAfter",
        "finetunedTestingAcc", 
        "finetunedTrainingAcc"
    ]

    const accs = {}
    accs["acc_before"] = {}
    const accsBefore = {}
    for (const id of percentiles) {
        accs[percentile_prefix + id] = 0;
        accs["acc_before"][percentile_prefix + id] = 0
    }
    var refAcc = 0

    for (const run of runs) {
        for (const subj of subjects) {
            for (const session of sessions) {
                for (const percentile of percentiles) {
                    accs[percentile_prefix + percentile] += d1[run_prefix + run][session][subj_prefix + subj][percentile_prefix + percentile]["finetunedTestingAcc"] / (runs.length * sessions.length * subjects.length);
                    accs["acc_before"][percentile_prefix + percentile] +=d1[run_prefix + run][session][subj_prefix + subj][percentile_prefix + percentile]["testAccBefore"] / (runs.length * sessions.length * subjects.length);
                }
            }
        }
    }

    console.log(accs);
    

}

export function crossSubjectCrossSessionAccs() {
    const d1 = require("./crossSubjectAndCrossSession_1657620236523.json")

    const run_prefix = "run_"
    const runs = arange(0, 13)

    const subj_prefix = "subj_"
    const subjects = arange(1, 10);

    const sessions = ["isReversed_false", "isReversed_true"]

    const percentile_prefix = "percentile_"
    const percentiles = [0.2]

    const ids = ["trainingAccBefore",
        "trainingAccAfter",
        "testAccBefore",
        "testAccAfter",
        "finetunedTestingAcc", 
        "finetunedTrainingAcc"
    ]

    const accs = {}
    for (const id of ids) {
        accs[id] = 0;
    }

    for (const run of runs) {
        for (const subj of subjects) {
            for (const session of sessions) {
                for (const percentile of percentiles)
                for (const id of ids) {
                    accs[id] += d1[run_prefix + run][session][subj_prefix + subj][percentile_prefix + percentile][id] / (runs.length * sessions.length * subjects.length * percentiles.length);
                }
            }
        }
    }

    console.log(accs);

}

export function crossSubjectCrossSessionAccsPercentiles() {
    const d1 = require("./crossSubjectAndCrossSession_percentilesGridSearch_1657635844546.json")

    const run_prefix = "run_"
    const runs = arange(0, 10)

    const subj_prefix = "subj_"
    const subjects = arange(1, 10);

    const sessions = ["isReversed_false", "isReversed_true"]

    const percentile_prefix = "percentile_"
    const percentiles = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95]

    const ids = ["trainingAccBefore",
        "trainingAccAfter",
        "testAccBefore",
        "testAccAfter",
        "finetunedTestingAcc", 
        "finetunedTrainingAcc"
    ]

    const accs = {}
    accs["acc_before"] = {}
    const accsBefore = {}
    for (const id of percentiles) {
        accs[percentile_prefix + id] = 0;
        accs["acc_before"][percentile_prefix + id] = 0
    }
    var refAcc = 0

    for (const run of runs) {
        for (const subj of subjects) {
            for (const session of sessions) {
                for (const percentile of percentiles) {
                    accs[percentile_prefix + percentile] += d1[run_prefix + run][session][subj_prefix + subj][percentile_prefix + percentile]["finetunedTestingAcc"] / (runs.length * sessions.length * subjects.length);
                    accs["acc_before"][percentile_prefix + percentile] +=d1[run_prefix + run][session][subj_prefix + subj][percentile_prefix + percentile]["testAccBefore"] / (runs.length * sessions.length * subjects.length);
                }
            }
        }
    }

    console.log(accs);
}


