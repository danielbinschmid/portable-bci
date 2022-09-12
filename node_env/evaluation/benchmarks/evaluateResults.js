

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
























