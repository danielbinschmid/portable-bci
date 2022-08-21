

const f = require("./cnnhdc_immediateUserun_30.15_1659552910556.json")

const run_prefix = "run_"
const runs = [0, 1, 2]
const percentiles = [0.05, 0.1, 0.15, 0.2, 0.5]
const session = ["train", "test"]
const subjects = [1, 2, 3, 4 ,5 , 7, 8, 9]

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