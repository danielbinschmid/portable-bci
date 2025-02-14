function readNaiveFinetuning() {
    const nF_ID = "IV2a_21-06_20220621-172111"
    const naiveFinetuningJson = require("./all_" + nF_ID + ".json")
    const runs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const run_prefix = "run_";

    const modes = ["all_subjects", "individual", "naive-finetuning"]

    for (const mode of modes) {
        const subjectAccs = {};

        for (const subj of subjects) { subjectAccs[subj] = 0; }

        for (const run of runs) {
            const run_id = run_prefix + run;
            for (const subject of subjects) {
                subjectAccs[subject] += naiveFinetuningJson[run_id][mode][subject]
            }
        }

        var avg = 0;
        for (const subj of subjects) {
            subjectAccs[subj] = subjectAccs[subj] / (runs.length);
            avg += subjectAccs[subj]
        }
        avg = avg / (subjects.length);

        console.log("Accuracies for mode: " + mode);
        console.log("Avg: " + avg)
        console.log(subjectAccs)
    }
}

function readLayerConstrained() {
    const lCF_ID = "EEGNetDTL"
    const layerConstrainedFinetuningJson = require("./all_" + lCF_ID + ".json")

    const runs = [0, 1, 2, 3]
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const run_prefix = "run_";
    const modes = ["nb_frozen_blocks_2", "nb_frozen_blocks_1"]
    const sessions = ["session_False", "session_True"]

    for (const mode of modes) {
        const subjectAccs = {};
        for (const subj of subjects) { subjectAccs[subj] = 0; }

        for (const run of runs) {
            const run_id = run_prefix + run;
            for (const subject of subjects) {
                for (const session of sessions) {
                    subjectAccs[subject] += layerConstrainedFinetuningJson[run_id][mode][subject][session]
                }   
                
            }
        }

        var avg = 0;
        for (const subj of subjects) {
            subjectAccs[subj] = subjectAccs[subj] / (runs.length * sessions.length);
            avg += subjectAccs[subj]
        }
        avg = avg / (subjects.length);

        console.log("Accuracies for mode: " + mode);
        console.log("Avg: " + avg)
        console.log(subjectAccs)
    }
}

function readRefNaive() {
    const lCF_ID = "EEGNet"
    const layerConstrainedFinetuningJson = require("./all_" + lCF_ID + ".json")

    const runs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const run_prefix = "run_";
    const modes = ["nb_frozen_blocks_0"]
    const sessions = ["session_False", "session_True"]

    for (const mode of modes) {
        const subjectAccs = {};
        for (const subj of subjects) { subjectAccs[subj] = 0; }

        for (const run of runs) {
            const run_id = run_prefix + run;
            for (const subject of subjects) {
                for (const session of sessions) {
                    subjectAccs[subject] += layerConstrainedFinetuningJson[run_id][mode][subject][session]
                }   
                
            }
        }

        var avg = 0;
        for (const subj of subjects) {
            subjectAccs[subj] = subjectAccs[subj] / (runs.length * sessions.length);
            avg += subjectAccs[subj]
        }
        avg = avg / (subjects.length);

        console.log("Accuracies for mode: " + mode);
        console.log("Avg: " + avg)
        console.log(subjectAccs)
    }
}

function crossSubjRef() {
    const lCF_ID = "eegnetCrossSubject"
    const layerConstrainedFinetuningJson = require("./all_" + lCF_ID + ".json")

    const runs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const run_prefix = "run_";
    const modes = ["nb_frozen_blocks_0"]
    const sessions = ["session_False", "session_True"]

    for (const mode of modes) {
        const subjectAccs = {};
        for (const subj of subjects) { subjectAccs[subj] = 0; }

        for (const run of runs) {
            const run_id = run_prefix + run;
            for (const subject of subjects) {
                for (const session of sessions) {
                    subjectAccs[subject] += layerConstrainedFinetuningJson[run_id][mode][subject][session]
                }   
                
            }
        }

        var avg = 0;
        for (const subj of subjects) {
            subjectAccs[subj] = subjectAccs[subj] / (runs.length * sessions.length);
            avg += subjectAccs[subj]
        }
        avg = avg / (subjects.length);

        console.log("Accuracies for mode: " + mode);
        console.log("Avg: " + avg)
        console.log(subjectAccs)
    }
}



function crossSession() {
    const d1 = require("./all_crossSession_1657217205638.json")

    const run_prefix = "run_"
    const runs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

    const subj_prefix = "subj_"
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    const sessions = ["session_True", "session_False"]

    const refID = "before_session_finetuning"

    const proportion_prefix = "proportion_"
    const proportions = [0.05, 0.1, 0.15, 0.2, 0.5]

    const accs = {}
    for (const subject of subjects) {
        accs[subject] = {}
        accs[subject][refID] = 0;
        for (const proportion of proportions) {
            accs[subject][proportion_prefix + proportion] = 0;
        }
    }

    for (const run of runs) {
        for (const subject of subjects) {
            for (const session of sessions) {
                accs[subject][refID] += d1[run_prefix + run][subj_prefix + subject][session][refID];
                for (const proportion of proportions) {
                    var li = d1[run_prefix + run][subj_prefix + subject][session][proportion_prefix + proportion]
                    var a = 0;
                    const l = li.length;
                    for (const e of li) {
                        a += e;
                    }
                    a = a / l;
                    accs[subject][proportion_prefix + proportion] += a;
                }
            }
        }
    }

    const proportionAvgs = {}
    for (const proportion of proportions) {
        proportionAvgs[proportion_prefix + proportion] = 0
    }
    var baselineAvg = 0;

    for (const subject of subjects) {
        accs[subject][refID] = accs[subject][refID] / (runs.length * sessions.length);
        baselineAvg += accs[subject][refID];
        for (const proportion of proportions) {
            accs[subject][proportion_prefix + proportion] = accs[subject][proportion_prefix + proportion] / (runs.length * sessions.length);
            proportionAvgs[proportion_prefix + proportion] += accs[subject][proportion_prefix + proportion];
        }
    }
    // console.log(accs);


    for (const proportion of proportions) {
        console.log(proportion_prefix + proportion + ": " + (proportionAvgs[proportion_prefix + proportion] / subjects.length));
    }
    console.log("baseline average: " + baselineAvg / subjects.length);
}

function subjectBlindTransfer() {
    const jsonAccs = require('./all_IV2a_cross-subject-blind-transfer20220606-152249.json');

    const runs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const run_prefix = "run_"
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    const accs = {}
    for (const subj of subjects) {
        accs[subj] = 0;
    }

    for (const run of runs) {
        for (const subj of subjects) {
            accs[subj] += jsonAccs[run_prefix + run][subj];
        }
    }

    var av = 0
    for (const subj of subjects) {
        accs[subj] = accs[subj] / runs.length;
        av += accs[subj];
    }
    av = av / subjects.length;

    console.log(accs)

    console.log("on average: " + av)
}

function crossSubject() {
    const d1 = require("./all_crossSubject_20220707-101903.json")

    const run_prefix = "run_"
    const runs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

    const subj_prefix = "subj_"
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]

    const sessions = ["session_True", "session_False"]

    const refID = "before_session_finetuning"

    const proportion_prefix = "proportion_"
    const proportions = [0.05, 0.1, 0.15, 0.2, 0.5]

    const accs = {}
    for (const subject of subjects) {
        accs[subject] = {}
        accs[subject][refID] = 0;
        for (const proportion of proportions) {
            accs[subject][proportion_prefix + proportion] = 0;
        }
    }

    for (const run of runs) {
        for (const subject of subjects) {
            for (const session of sessions) {
                accs[subject][refID] += d1[run_prefix + run][subj_prefix + subject][session][refID];
                for (const proportion of proportions) {
                    var li = d1[run_prefix + run][subj_prefix + subject][session][proportion_prefix + proportion]
                    var a = 0;
                    const l = li.length;
                    for (const e of li) {
                        a += e;
                    }
                    a = a / l;
                    accs[subject][proportion_prefix + proportion] += a;
                }
            }
        }
    }

    const proportionAvgs = {}
    for (const proportion of proportions) {
        proportionAvgs[proportion_prefix + proportion] = 0
    }
    var baselineAvg = 0;

    for (const subject of subjects) {
        accs[subject][refID] = accs[subject][refID] / (runs.length * sessions.length);
        baselineAvg += accs[subject][refID];
        for (const proportion of proportions) {
            accs[subject][proportion_prefix + proportion] = accs[subject][proportion_prefix + proportion] / (runs.length * sessions.length);
            proportionAvgs[proportion_prefix + proportion] += accs[subject][proportion_prefix + proportion];
        }
    }
    // console.log(accs);


    for (const proportion of proportions) {
        console.log(proportion_prefix + proportion + ": " + (proportionAvgs[proportion_prefix + proportion] / subjects.length));
    }
    console.log("baseline average: " + baselineAvg / subjects.length);
}

function eegnetPartialFinetuning() {

    const d1 = require("./all_EEGNetPartialFinetuning.json")

    const run_prefix = "run_"
    const runs = [0, 1, 2, 3, 4, 5]// arange(0, 10)

    const subj_prefix = ""
    const subjects = [1,2,3,4,5,6,7,8,9];

    const sessions = ["session_False", "session_True"]

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
                    const a = d1[run_prefix + run][session][subj_prefix + subj][percentile_prefix + percentile + percentile_suffix]
                    accs[percentile_prefix + percentile] += a / (runs.length * sessions.length * subjects.length);
                }
            }
        }
    }
    console.log(accs);

}
// eegnetPartialFinetuning()
crossSubjRef()
// crossSession()
console.log("///////////")
// crossSubject()
readRefNaive()
// crossSubject()
readLayerConstrained()
// readLayerConstrained()
subjectBlindTransfer()
crossSubjRef()
