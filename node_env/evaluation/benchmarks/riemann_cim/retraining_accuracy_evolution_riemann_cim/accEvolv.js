
const fi = require("./accEvolvAll.json")


const runs = [0,1, 2, 3, 4, 5]

const modes = ["hrr", "fhrr"]

const avg = {}

for (const mode of modes) {
    avg[mode] = {
        "retrain_train": [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
        ],
        "retrain_test": [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0]
    }
}


for (const run of runs) {
    for (const mode of modes) {
        avg[mode]["retrain_train"][0] += fi[run][mode]["accTrainBeforeRetrain"] / runs.length;
        avg[mode]["retrain_test"][0] +=  fi[run][mode]["accTestBeforeRetrain"] / runs.length;
        for (const s of [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9]) {
            avg[mode]["retrain_train"][s + 1] += fi[run][mode]["retrain_train"][s] / runs.length;
            avg[mode]["retrain_test"][s + 1] +=  fi[run][mode]["retrain_test"][s] / runs.length;
        }
    }
    

}

console.log(avg)