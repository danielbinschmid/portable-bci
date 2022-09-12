
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


function hrrImmediateOnline() {
    const d1 = require("./hersche_immediate_online.json")

    const run_prefix = "run_"
    const subj_prefix = "subj_"
    const proportionPrefix = "proportion_"

    const runs = [0]
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



function herschePartialCrossSession() {
    const d1 = require("./hersche_partial_cross_session_1659616644098.json")

    const run_prefix = "run_"
    const runs = [0, 1, 2, 3, 4, 5, 6, 7, 8]// arange(0, 10)

    const subj_prefix = "subj_"
    const subjects = arange(1, 10);

    const sessions = ["isReversed_false", "isReversed_true"]

    const percentile_prefix = "percentage_"
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
                    const a = d1[run_prefix + run][subj_prefix + subj][session][percentile_prefix + percentile + percentile_suffix]
                    accs[percentile_prefix + percentile] += a / (runs.length * sessions.length * subjects.length);
                }
            }
        }
    }
    console.log("$$")
    console.log(accs);
}

herschePartialCrossSession()
hrrImmediateOnline()