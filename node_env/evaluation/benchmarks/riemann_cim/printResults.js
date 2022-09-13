

/**
 * 
 * @param {number} start 
 * @param {number} end 
 * @returns {number[]}
 */
 function arange(start, end) {
    const arr = []
    for (var i = start; i < end; i++) { arr.push(i); }
    return arr;
}

const precision = 1000

function hrrRetrainAcc() {
    const hrrRetrainJson = require("./hdcHRR_02-08.json") //re("./hdcHRR_retrain-it-20_lr-0-2_init-lr-1.json")
    const test_runs = arange(0, 8);
    const test_run_prefix = "run_";
    const subjects = arange(1, 10);
    const subject_prefix = "subj_";
    const switches = ["isReversed_false", "isReversed_true"];


    const accuracies = {}
    for (const subj of subjects) {
        accuracies[subj] = 0;
    }

    for (const test_run of test_runs) {
        for (const subject of subjects) {
            for (const switch_ of switches) {
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
    console.log("------ CROSS-SESSION ------")
    console.log("Network: Riemann-CiM-HRR")
    console.log("Average accuracy: " + Math.round((avg * 100 * precision / subjects.length)) / precision)
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
    
}


function onlineCrossSessionAdaptionNoRiemannRefChangeAcc() {
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

    console.log("------ CROSS-SESSION-ONLINE-LEARNING ------")
    console.log("Network: Riemann-CiM-HRR")
 
    for (const proportion of proportions) {
        console.log(proportion * 100 + "% of test session for training: " + (proportionAvgs[proportionPrefix + proportion] / subjects.length));
    }
    console.log("0% of test session for training: " + baselineAvg / subjects.length);
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
}



function onlineCrossSubjectNaive() {
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

    console.log("------ CROSS-SUBJECT ------")
    console.log("Network: Riemann-CiM-HRR")
 
    for (const proportion of proportions) {
        console.log(proportion * 100 + "% of target subject data for training: " + (proportionAvgs[proportionPrefix + proportion] / subjects.length));
    }
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^")


}

function partialTrainingTransferfHRR() {
    const d1 = require("./partialTrainingFHRR.json")

    const run_prefix = "run_"
    const runs = [0, 1, 2, 3, 4]// arange(0, 10)

    const subj_prefix = "subj_"
    const subjects = arange(1, 10);

    const sessions = ["isReversed_false", "isReversed_true"]

    const percentile_prefix = "partialTraining_"
    const percentile_suffix = ""
    const training_percentiles = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1]



    const accs = {}
    for (const id of training_percentiles) {
        accs[percentile_prefix + id] = 0;
    }
    var refAcc = 0

    for (const run of runs) {
        for (const percentile of training_percentiles) {
            for (const session of sessions) {
                for (const subj of subjects) {
                    const a = d1[run_prefix + run][percentile_prefix + percentile + percentile_suffix][subj_prefix + subj][session]
                    accs[percentile_prefix + percentile] += a / (runs.length * sessions.length * subjects.length);
                }
            }
        }
    }

    console.log("------ CROSS-SESSION ------")
    console.log("Network: Riemann-CiM-fHRR")
    console.log("Mode: Partial training sets")
    const accs_ = {}
    for (const percentile of training_percentiles) {
       accs_[percentile * 100 + "% of training set for training"] = accs[percentile_prefix + percentile]
    }
    console.log(accs_)
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^")
}




function partialTrainingTransferHRR() {
    const d1 = require("./partialTrainingSetsHDC_1658569213223.json")

    const run_prefix = "run_"
    const runs = [0, 1, 2, 3, 4]// arange(0, 10)

    const subj_prefix = "subj_"
    const subjects = arange(1, 10);

    const sessions = ["isReversed_false", "isReversed_true"]

    const percentile_prefix = "trainData"
    const percentile_suffix = "_"
    const training_percentiles = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1]

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
    for (const id of training_percentiles) {
        accs[percentile_prefix + id] = 0;
        accs["acc_before"][percentile_prefix + id] = 0
    }
    var refAcc = 0

    for (const run of runs) {
        for (const percentile of training_percentiles) {
            for (const session of sessions) {
                for (const subj of subjects) {
                    const a = d1[run_prefix + run][percentile_prefix + percentile + percentile_suffix][session][subj_prefix + subj]
                    accs[percentile_prefix + percentile] += a["finetunedTestingAcc"] / (runs.length * sessions.length * subjects.length);
                    accs["acc_before"][percentile_prefix + percentile] += a["testAccBefore"] / (runs.length * sessions.length * subjects.length);
                }
            }
        }
    }
    
    console.log("------ CROSS-SESSION ------")
    console.log("Network: Riemann-CiM-HRR")
    console.log("Mode: DRO, and partial training sets")
    const accs_ = {}
    for (const percentile of training_percentiles) {
       accs_[percentile * 100 + "% of training set for training"] = accs[percentile_prefix + percentile]
    }
    console.log(accs_)
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^")
}

hrrRetrainAcc()

onlineCrossSessionAdaptionNoRiemannRefChangeAcc()

onlineCrossSubjectNaive()

partialTrainingTransferHRR()

partialTrainingTransferfHRR()