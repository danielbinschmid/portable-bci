function readNaiveFinetuning() {
    const nF_ID = "IV2a_21-06_20220621-172111"
    const naiveFinetuningJson = require("./" + nF_ID + "/all_" + nF_ID + ".json")
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
    const lCF_ID = "IV2a_layer-constrained-finetuning_20220622-123753"
    const layerConstrainedFinetuningJson = require("./" + lCF_ID + "/all_" + lCF_ID + ".json")

    const runs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const run_prefix = "run_";
    const modes = ["nb_frozen_blocks_2", "nb_frozen_blocks_1"]

    for (const mode of modes) {
        const subjectAccs = {};
        for (const subj of subjects) { subjectAccs[subj] = 0; }

        for (const run of runs) {
            const run_id = run_prefix + run;
            for (const subject of subjects) {
                subjectAccs[subject] += layerConstrainedFinetuningJson[run_id][mode][subject]
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

function crossSession() {
    const fname = "./all_crossSession_20220706-182319.json"
    const accsJson = require(fname);

    const run_prefix = "run_";
    const runs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const subj_prefix = "subj_";
    const subjects = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const ref_id = "before_session_finetuning";

    const proportion_prefix = "proportion_";
    const proportions = ["0.05", "0.1", "0.15", "0.2", "0.5"]

    const accs = {}
    for (const proportion of proportions) {
        accs[proportion] = 0;
    }

    var avgRef = 0
    for (const run of runs) {
        for (const subject of subjects) {
            avgRef += accsJson[run_prefix + run][subj_prefix + subject][ref_id] * (1 / (subjects.length * runs.length));
    
            for (const proportion of proportions) {
                const propAccs = accsJson[run_prefix + run][subj_prefix + subject][proportion_prefix + proportion]
                var avg = 0;
                for (const propAcc of propAccs) {
                    avg += propAcc * (1 / propAccs.length);
                }
                accs[proportion] += avg * (1 / (subjects.length * runs.length));
            }
        }
    }
    

    console.log("ref: " + avgRef)
    console.log(accs)
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

crossSession()
// readNaiveFinetuning()
// readLayerConstrained()