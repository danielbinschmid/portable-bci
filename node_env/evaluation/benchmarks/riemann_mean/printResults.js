const TEST_RUN_ = "test_run_"
const FOLD_ = "fold_"
const SUBJ_ = "subj_"


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

function meanMetricAccuracies() {
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

function crossSessionMeanMetricAccuracies() {
    const crossSessionMeanMetricAccuraciesJson = require("./noTransfer_17_06.json");
    const test_runs = [0, 1, 2, 3, 4]
    const test_run_prefix = "test_run_";
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

    for (const test_run of test_runs) {
        for (const subject of subjects) {
            for (const metric of metrics) {
                for (const switch_ of switches) {
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




function transferBaselineAccs() {
    const transferBaselineJson = require("./transferBaseline_1655480615422.json");
    const test_runs = [0]
    const test_run_prefix = "test_run_";
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

    for (const test_run of test_runs) {
        for (const subject of subjects) {
            for (const metric of metrics) {
                for (const switch_ of switches) {
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


function sessionTransferRiemannEuclidianAccs() {
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
meanMetricAccuracies()
crossSessionMeanMetricAccuracies()
transferBaselineAccs()
sessionTransferRiemannEuclidianAccs()