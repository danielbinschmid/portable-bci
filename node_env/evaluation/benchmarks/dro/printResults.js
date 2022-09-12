
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

function crossSubjectCrossSessionAccs() {
    const d1 = require("./dimRankingRiemannAdaption-02-08.json") // crossSubjectAndCrossSession_1657620236523.json")

    const run_prefix = "run_"
    const runs = arange(0, 10)

    const subj_prefix = "subj_"
    const subjects = arange(1, 10);

    const sessions = ["isReversed_false", "isReversed_true"]

    const percentile_prefix = "percentile_"
    const percentiles = [0.5]

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

    const accs_ = {}
    accs_["Test accuracy after DRO"] = accs["testAccBefore"] 
    accs_["Test accuracy before DRO"] = accs["finetunedTestingAcc"] 
    accs_["Training accuracy after DRO"] = accs["trainingAccBefore"] 
    accs_["Training accuracy before DRO"] = accs["finetunedTrainingAcc"] 


    console.log("------ CROSS-SESSION EVALUATION ------")
    console.log("Network: Riemann-CiM-HRR with DRO")
    
    console.log(accs_)
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
}

function overfitReduce() {
    const d1 = require("./dimRankingGridSearch-02-08.json") // crossSubjectAndCrossSession_percentilesGridSearch_1657635844546.json")

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

    accs["trainAccBefore"] = 0;
    accs["testAccBefore"] = 0;
    accs["trainAccAfter"] = 0;
    accs["testAccAfter"] = 0;
    var refAcc = 0

    for (const run of runs) {
        for (const subj of subjects) {
            for (const session of sessions) {
                for (const percentile of percentiles) {
                    const config = d1[run_prefix + run][session][subj_prefix + subj][percentile_prefix + percentile]
                    const trainAccAfter = config["finetunedTrainingAcc"]
                    const testAccAfter = config["finetunedTestingAcc"]
                    const trainAcc = config["trainingAccBefore"]
                    const testAcc = config["testAccBefore"]

                    accs["trainAccBefore"] += trainAcc / (runs.length * sessions.length * subjects.length);
                    accs["testAccBefore"] += testAcc / (runs.length * sessions.length * subjects.length);
                    accs["trainAccAfter"] += trainAccAfter / (runs.length * sessions.length * subjects.length);
                    accs["testAccAfter"] += testAccAfter / (runs.length * sessions.length * subjects.length);
                }
            }
        }
    }

    console.log("------ TRAINING/TEST ACC W/O DRO ------")
    console.log("Network: Riemann-CiM-HRR with DRO")
    
    console.log(accs)
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
}


function crossSubjectCrossSessionAccsPercentiles() {
    const d1 = require("./dimRankingGridSearch-02-08.json") // crossSubjectAndCrossSession_percentilesGridSearch_1657635844546.json")

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
    accs["acc_before"] = 0
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
                    accs["acc_before"] += d1[run_prefix + run][session][subj_prefix + subj][percentile_prefix + percentile]["testAccBefore"] / (runs.length * sessions.length * subjects.length * percentiles.length);
                }
            }
        }
    }

    console.log("------ DRO HYPERPARAMETER ------")
    console.log("Network: Riemann-CiM-HRR with DRO")
    
    console.log(accs)
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
}

function crossSubjectAccs() {
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

    console.log("------ CROSS-SESSION ------")
    console.log("Network: Riemann-CiM-HRR with DRO")
    console.log("Mode: Without Riemannian transfer adaption")
    const precision = 100
    console.log("Test accuracy without DRO: " + Math.round(accs["testAccBefore"] * 100 * precision ) / precision + "%")
    console.log("Test accuracy with DRO: " + Math.round(accs["finetunedTestingAcc"] * 100 * precision ) / precision + "%")
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")

}



crossSubjectCrossSessionAccs()
overfitReduce()

crossSubjectCrossSessionAccsPercentiles()
crossSubjectAccs()
