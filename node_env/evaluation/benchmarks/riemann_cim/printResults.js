

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

    console.log(accuracies);

    console.log("average: " + (avg / subjects.length))
}

function riemannCiMAccs() {
    const riemannCiM = require("./hdcRiemannCiM_1656326660212.json")
    const test_runs = arange(0, 10);
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


function onlineCrossSessionAdaptionAcc() {
    const d1 = require("./onlineCrossSessionAdaption_12its_0-01lr_1656973842777.json")

    const run_prefix = "run_"
    const subj_prefix = "subj_"
    const proportionPrefix = "proportion_"

    const runs = [0]
    const subjects = [1, 2, 3, 4, 5]
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
    console.log(accs);


    for (const proportion of proportions) {
        console.log(proportionPrefix + proportion + ": " + (proportionAvgs[proportionPrefix + proportion] / subjects.length));
    }
    console.log("baseline average: " + baselineAvg / subjects.length);

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
    console.log(accs);


    for (const proportion of proportions) {
        console.log(proportionPrefix + proportion + ": " + (proportionAvgs[proportionPrefix + proportion] / subjects.length));
    }

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

    console.log(accs);
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

    console.log(accs);
}

hrrRetrainAcc()

riemannCiMAccs()

onlineCrossSessionAdaptionAcc()

onlineCrossSessionAdaptionNoRiemannRefChangeAcc()

onlineCrossSubjectNaive()

partialTrainingTransferHRR()

partialTrainingTransferfHRR()