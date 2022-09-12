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

function cnnHDCPartialCrossSession() {
    const d1 = require("./accs_cnnHDC_partialCrossSession_1659620131497.json")

    const run_prefix = "run_"
    const runs = [0, 1]// arange(0, 10)

    const subj_prefix = ""
    const subjects = arange(1, 10);

    const sessions = ["false", "true"]

    const percentile_prefix = ""
    const percentile_suffix = ""
    const training_percentiles = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1]



    const accs = {}
    for (const id of training_percentiles) {
        accs[percentile_prefix + id] = 0;
    }

    for (const run of runs) {
        for (const percentile of training_percentiles) {
            for (const session of sessions) {
                for (const subj of subjects) {
                    const a = d1[run_prefix + run][percentile_prefix + percentile + percentile_suffix][subj_prefix + subj][session]["testAcc"]
                    accs[percentile_prefix + percentile] += a / (runs.length * sessions.length * subjects.length);
                }
            }
        }
    }

    console.log(accs);
}

function cnnHDCPartial() {
    const d1 = require("./accs_cnnHDC_partial.json")

    const run_prefix = "run_"
    const runs = [0, 1, 2, 3, 4]

    const subj_prefix = ""
    const subjects = arange(1, 10);

    const sessions = ["false", "true"]

    const percentile_prefix = ""
    const percentile_suffix = ""
    const training_percentiles = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1]



    const accs = {}
    for (const id of training_percentiles) {
        accs[percentile_prefix + id] = 0;
    }

    for (const run of runs) {
        for (const percentile of training_percentiles) {
            for (const session of sessions) {
                for (const subj of subjects) {
                    const a = d1[run_prefix + run][percentile_prefix + percentile + percentile_suffix][subj_prefix + subj][session]["testAcc"]
                    accs[percentile_prefix + percentile] += a / (runs.length * sessions.length * subjects.length);
                }
            }
        }
    }

    console.log(accs);
}



function cnnHDCRef() {
    const d1 = require("./accs_cnnHDC_Ref_16_08_YY_1660664297694.json") // "./accs_cnnHDC_Ref_16_08_1660648407953.json")

    const run_prefix = "run_"
    const runs = [0, 1, 2, 3, 4, 5, 6, 7]

    const subj_prefix = ""
    const subjects = arange(1, 10);

    const sessions = ["false", "true"]

    const percentile_prefix = ""
    const percentile_suffix = ""
    const training_percentiles = [-1]



    const accs = {}
    for (const id of training_percentiles) {
        accs[percentile_prefix + id] = 0;
    }

    for (const run of runs) {
        for (const percentile of training_percentiles) {
            for (const session of sessions) {
                for (const subj of subjects) {
                    const a = d1[run_prefix + run][percentile_prefix + percentile + percentile_suffix][subj_prefix + subj][session]["testAcc"]
                    accs[percentile_prefix + percentile] += a / (runs.length * sessions.length * subjects.length);
                }
            }
        }
    }

    console.log(accs);
}

function cnnHDCImmediateUse() {
    const f = require("./cnnhdc_immediateUserun_30.15_1659552910556.json")

    const run_prefix = "run_"
    const runs = [0, 1, 2]
    const percentiles = [0.05, 0.1, 0.15, 0.2, 0.5]
    const session = ["train", "test"]
    const subjects = [1, 2, 3, 4, 5, 7, 8, 9]

    const accs = {}
    for (const p of percentiles) {
        accs[p] = 0
    }

    for (const run of runs) {
        for (const perc of percentiles) {
            for (const s of session) {
                for (const subj of subjects) {
                    accs[perc] += f[run_prefix + run][perc][s][subj]["testAcc"] / (runs.length * session.length * subjects.length)
                }
            }
        }
    }

    console.log(accs)
}

cnnHDCPartialCrossSession()
cnnHDCPartial()

cnnHDCRef()
cnnHDCImmediateUse()